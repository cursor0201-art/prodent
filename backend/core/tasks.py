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

@shared_task
def send_appointment_reminders():
    """
    Каждую минуту проверяет записи на приём и отправляет напоминания:
    за 1 час, за 30 минут и за 10 минут.
    """
    from appointments.models import Appointment
    now = timezone.now()
    
    # Ищем записи в ближайшие 65 минут, у которых есть chat_id
    upcoming = Appointment.objects.filter(
        status='BOOKED',
        start_time__gte=now,
        start_time__lte=now + timedelta(minutes=65),
        patient__telegram_chat_id__isnull=False
    ).exclude(patient__telegram_chat_id='')
    
    sent_count = 0
    for appt in upcoming:
        time_diff = (appt.start_time - now).total_seconds() / 60.0
        
        should_send = False
        reminder_text = ""
        
        minutes_left = round(time_diff)
        
        # Проверяем округленное количество минут (т.к. cron работает каждую минуту, он попадет в это значение ровно 1 раз)
        if minutes_left == 60:
            should_send = True
            reminder_text = "ровно через 1 час"
        elif minutes_left == 30:
            should_send = True
            reminder_text = "через 30 минут"
        elif minutes_left == 10:
            should_send = True
            reminder_text = "через 10 минут"
            
        if should_send:
            service_name = appt.service.name_ru if appt.service else 'Консультация'
            message = (
                f"🔔 <b>Напоминание о приёме!</b>\n\n"
                f"Здравствуйте, {appt.patient.first_name}! 👋\n"
                f"Ваш приём у стоматолога начнется <b>{reminder_text}</b>.\n\n"
                f"👨‍⚕️ Врач: <b>{appt.doctor}</b>\n"
                f"🩺 Услуга: {service_name}\n"
                f"📅 Время: <b>{timezone.localtime(appt.start_time).strftime('%H:%M')}</b>\n\n"
                f"Ждем вас!"
            )
            send_telegram_message(message, to_chat_id=appt.patient.telegram_chat_id)
            sent_count += 1
            
    return f"Отправлено напоминаний: {sent_count}"
