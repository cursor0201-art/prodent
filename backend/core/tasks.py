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
    за 1 день, за 1 час, за 30 минут и за 10 минут.
    """
    from appointments.models import Appointment
    now = timezone.now()

    # Ищем записи, которые начнутся в ближайшие 24 часа + 1 час.
    upcoming = Appointment.objects.filter(
        status='BOOKED',
        start_time__gte=now,
        start_time__lte=now + timedelta(days=1, hours=1)
    )

    reminder_offsets = (1440, 60, 30, 10)

    sent_count = 0
    for appt in upcoming:
        time_diff = (appt.start_time - now).total_seconds() / 60.0
        reminder_minutes = next(
            (offset for offset in reminder_offsets if offset - 2 <= time_diff <= offset + 1),
            None,
        )
        if reminder_minutes is None:
            continue

        # Уведомления в Telegram
        if appt.patient.telegram_chat_id:
            service_name = appt.service.name_ru if appt.service else 'Консультация'
            tg_message = (
                f"🔔 <b>Напоминание о приёме!</b>\n\n"
                f"Здравствуйте, {appt.patient.first_name}! 👋\n"
                f"Ваш приём у стоматолога начнется через <b>{reminder_minutes} мин.</b>.\n\n"
                f"👨‍⚕️ Врач: <b>{appt.doctor}</b>\n"
                f"🩺 Услуга: {service_name}\n"
                f"📅 Время: <b>{timezone.localtime(appt.start_time).strftime('%H:%M')}</b>\n\n"
                f"Ждем вас!"
            )
            send_telegram_message(tg_message, to_chat_id=appt.patient.telegram_chat_id)

        # Уведомления через Eskiz SMS
        if appt.patient.phone:
            from core.services.eskiz import eskiz_service
            if eskiz_service.send_reminder_sms(appt, reminder_minutes=reminder_minutes):
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
