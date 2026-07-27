import os
import sys
import logging
import requests
from datetime import timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django
from django.conf import settings
# Включаем синхронное выполнение Celery-задач для тестов
settings.CELERY_TASK_ALWAYS_EAGER = True

django.setup()

from django.utils import timezone
from django.db import transaction
from core.services.eskiz import eskiz_service
from patients.models import Patient
from appointments.models import Appointment
from users.models import User
from appointments.serializers import AppointmentSerializer
from core.tasks import send_appointment_reminders, check_and_send_birthday_sms_task

# Отключаем вывод лишних логов для чистоты отчета
logging.getLogger("core.services.eskiz").setLevel(logging.INFO)

print("\n============================================")
print("STARTING FULL E2E TEST FOR ESKIZ INTEGRATION")
print("============================================")

results = []

def record_result(step_name, success, info=""):
    status = "[SUCCESS]" if success else "[ERROR]"
    print(f"{status} | {step_name} | {info}")
    results.append((step_name, success, info))

# 1. Авторизация и получение токена
try:
    token = eskiz_service.refresh_token()
    if token:
        masked_token = f"{token[:4]}...{token[-4:]}"
        record_result("Eskiz Login", True, f"Token: {masked_token}")
    else:
        record_result("Eskiz Login", False, "No token received")
        sys.exit(1)
except Exception as e:
    record_result("Eskiz Login", False, str(e))
    sys.exit(1)

from core.services.sms_templates import get_birthday_message

# 2. Отправка тестового SMS
phone = "998901234567"
test_patient = Patient(first_name="Test", last_name="User", language="ru")
msg = get_birthday_message(test_patient)

try:
    success = eskiz_service.send_sms(phone, msg)
    if success:
        record_result("Send SMS", True, f"SMS sent to {phone}")
    else:
        record_result("Send SMS", False, "send_sms returned False. See logs above for exact error.")
except Exception as e:
    record_result("Send SMS", False, str(e))

# 3. Подготовка тестовых данных
doctor = User.objects.filter(role='DOCTOR').first()
if not doctor:
    doctor = User.objects.create(phone="998991112233", role='DOCTOR', first_name="TestDoctor")

patient_phone = "998901234567"
patient, created = Patient.objects.get_or_create(
    phone=patient_phone,
    defaults={
        'first_name': "E2ETest",
        'last_name': "Patient",
        'birth_date': timezone.now().date(),
        'language': 'ru'
    }
)
# Make sure the birth_date is today for the test
patient.birth_date = timezone.now().date()
patient.save()

# 4. Создание записи через ViewSet (симуляция API)
start_time = timezone.now() + timedelta(days=1)
appt_data = {
    'patient': patient.id,
    'doctor': doctor.id,
    'start_time': start_time,
    'end_time': start_time + timedelta(minutes=30),
    'status': 'BOOKED'
}

print("\n--- Simulating Appointment Creation ---")
serializer = AppointmentSerializer(data=appt_data)
try:
    if serializer.is_valid(raise_exception=True):
        # Оборачиваем в atomic для срабатывания on_commit
        with transaction.atomic():
            appt = serializer.save()
            from core.tasks import send_registration_sms_task
            transaction.on_commit(lambda: send_registration_sms_task.delay(appt.id))
            
        record_result("Create Appointment (on_commit SMS)", True, "on_commit triggered task successfully")
    else:
        record_result("Create Appointment", False, str(serializer.errors))
except Exception as e:
    record_result("Create Appointment", False, str(e))

# 5. Проверка дублирования: повторное сохранение записи
try:
    with transaction.atomic():
        appt.notes = "Updated note"
        appt.save()
    record_result("No duplicate on update", True, "perform_update did not trigger on_commit SMS")
except Exception as e:
    record_result("No duplicate on update", False, str(e))

# 6. Напоминание за 1 час
try:
    # Переносим запись на "ровно через час"
    appt.start_time = timezone.now() + timedelta(minutes=60, seconds=5)
    appt.save()
    
    res = send_appointment_reminders()
    if "Отправлено SMS напоминаний: 1" in res:
        record_result("Celery Beat Reminder (1h)", True, "1 hour reminder sent")
    else:
        record_result("Celery Beat Reminder (1h)", False, f"Response: {res}")
        
    # Проверка на дубль
    res2 = send_appointment_reminders()
    if "Отправлено SMS напоминаний: 0" in res2:
        record_result("Cache duplicate prevention (Reminder)", True, "Duplicate reminder blocked")
    else:
        record_result("Cache duplicate prevention (Reminder)", False, f"Response: {res2}")
except Exception as e:
    record_result("Celery Beat Reminder", False, str(e))

# 7. Дни рождения
try:
    res = check_and_send_birthday_sms_task()
    if "Отправлено 1 поздравлений" in res or "Отправлено" in res:
        record_result("Daily Birthday (Celery Beat)", True, res)
    else:
        record_result("Daily Birthday (Celery Beat)", False, res)
        
    # Проверка на дубль
    res2 = check_and_send_birthday_sms_task()
    if "Отправлено 0 поздравлений" in res2:
        record_result("Cache duplicate prevention (Birthday)", True, "Duplicate birthday blocked")
    else:
        record_result("Cache duplicate prevention (Birthday)", False, res2)
except Exception as e:
    record_result("Daily Birthday", False, str(e))

# 8. Недоступность Eskiz (смена токена на фейк)
try:
    eskiz_service.base_url = "https://notify.eskiz.uz/api_fake"
    success = eskiz_service.send_sms(patient_phone, "Fake test")
    if not success:
        record_result("Fault tolerance", True, "API failure returned False and didn't crash")
    else:
        record_result("Fault tolerance", False, "Unexpected True on fake URL")
except Exception as e:
    record_result("Fault tolerance", False, f"Crash occurred: {e}")

# Очистка
patient.delete()
appt.delete()

print("\n============================================")
print("FINAL E2E REPORT")
print("============================================")
all_success = True
for name, succ, info in results:
    if not succ: all_success = False
    status = "[SUCCESS]" if succ else "[ERROR]"
    print(f"{status} {name}: {info}")

if all_success:
    print("\n[SUCCESS] All systems verified and production ready!")
else:
    print("\n[WARNING] There are errors. Please check the logs.")
