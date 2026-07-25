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
        start_time__lte=now + timedelta(minutes=65)
    )
    
    sent_count = 0
    for appt in upcoming:
        time_diff = (appt.start_time - now).total_seconds() / 60.0
        minutes_left = round(time_diff)
        
        # Уведомления в Telegram
        if appt.patient.telegram_chat_id:
            should_send_tg = False
            reminder_text = ""
            if minutes_left == 60:
                should_send_tg, reminder_text = True, "ровно через 1 час"
            elif minutes_left == 30:
                should_send_tg, reminder_text = True, "через 30 минут"
            elif minutes_left == 10:
                should_send_tg, reminder_text = True, "через 10 минут"
                
            if should_send_tg:
                service_name = appt.service.name_ru if appt.service else 'Консультация'
                tg_message = (
                    f"🔔 <b>Напоминание о приёме!</b>\n\n"
                    f"Здравствуйте, {appt.patient.first_name}! 👋\n"
                    f"Ваш приём у стоматолога начнется <b>{reminder_text}</b>.\n\n"
                    f"👨‍⚕️ Врач: <b>{appt.doctor}</b>\n"
                    f"🩺 Услуга: {service_name}\n"
                    f"📅 Время: <b>{timezone.localtime(appt.start_time).strftime('%H:%M')}</b>\n\n"
                    f"Ждем вас!"
                )
                send_telegram_message(tg_message, to_chat_id=appt.patient.telegram_chat_id)
        
        # Уведомления через Eskiz SMS (ровно за 1 час)
        if minutes_left == 60 and appt.patient.phone:
            from core.services.eskiz import eskiz_service
            if eskiz_service.send_reminder_sms(appt):
                sent_count += 1
            
    return f"Отправлено SMS напоминаний: {sent_count}"

@shared_task
def send_registration_sms_task(appointment_id):
    from appointments.models import Appointment
    from core.services.eskiz import eskiz_service
    
    try:
        appt = Appointment.objects.get(id=appointment_id)
        success = eskiz_service.send_registration_sms(appt)
        return "Registration SMS sent" if success else "Failed to send Registration SMS"
    except Appointment.DoesNotExist:
        return "Appointment not found"

@shared_task
def check_and_send_birthday_sms_task():
    from patients.models import Patient
    from core.services.eskiz import eskiz_service
    from django.utils import timezone
    
    today = timezone.localtime().date()
    # Ищем пациентов у которых сегодня день рождения (игнорируя год)
    birthday_patients = Patient.objects.filter(
        birth_date__month=today.month,
        birth_date__day=today.day
    ).exclude(phone='')
    
    sent = 0
    for patient in birthday_patients:
        if eskiz_service.send_birthday_sms(patient):
            sent += 1
            
    return f"Отправлено {sent} поздравлений с днем рождения."
