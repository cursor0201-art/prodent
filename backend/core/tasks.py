from celery import shared_task
from core.telegram_utils import send_telegram_message
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_telegram_message_async(text, to_chat_id=None, reply_markup=None):
    """
    Асинхронная задача для отправки сообщений в Telegram.
    Это предотвращает блокировку HTTP-ответов API при медленной работе серверов Telegram.
    """
    logger.info(f"Sending async telegram message to {to_chat_id or 'default clinic chat'}")
    send_telegram_message(text, to_chat_id=to_chat_id, reply_markup=reply_markup)

@shared_task
def check_material_expirations():
    """
    Ежедневная задача: Проверяет материалы, у которых истекает срок годности в ближайшие 30 дней,
    и отправляет сводный отчет администратору.
    """
    from inventory.models import Material
    
    threshold_date = timezone.now().date() + timedelta(days=30)
    expiring_materials = Material.objects.filter(
        expiration_date__lte=threshold_date,
        quantity__gt=0
    ).order_by('expiration_date')
    
    if not expiring_materials.exists():
        return "Нет материалов с истекающим сроком."
        
    lines = ["⚠️ <b>Отчет по срокам годности материалов</b>\n"]
    for mat in expiring_materials:
        days_left = (mat.expiration_date - timezone.now().date()).days
        if days_left < 0:
            status = "❌ ПРОСРОЧЕНО"
        elif days_left <= 7:
            status = f"🔴 Осталось {days_left} дн."
        else:
            status = f"🟠 Осталось {days_left} дн."
            
        lines.append(f"• {mat.name}: {mat.quantity} {mat.unit} ({mat.expiration_date.strftime('%d.%m.%Y')} — {status})")
        
    message = "\n".join(lines)
    send_telegram_message(message)
    return f"Отчет отправлен. Найдено материалов: {expiring_materials.count()}"
