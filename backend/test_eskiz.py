import os
import django
import sys
import logging
import requests

# Setup django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

logging.basicConfig(level=logging.INFO)

from core.services.eskiz import eskiz_service
from appointments.models import Appointment
from patients.models import Patient
from django.utils import timezone
from datetime import timedelta

print("\n--- 1. Testing Login to Eskiz ---")
try:
    token = eskiz_service.refresh_token()
    if token:
        masked_token = f"{token[:4]}...{token[-4:]}" if len(token) > 10 else "ERROR"
        print(f"✅ Bearer Token successfully received: {masked_token}")
    else:
        print("❌ Failed to get Bearer Token. Please check credentials in .env.")
        sys.exit(1)
except Exception as e:
    print(f"❌ Exception during login: {e}")
    sys.exit(1)

from core.services.sms_templates import get_registration_message
from django.utils import timezone

phone = "998901234567"
patient = Patient.objects.filter(phone=phone).first()
if not patient:
    patient = Patient(first_name="Test", last_name="User", language="ru")

msg = get_registration_message(patient, timezone.now().strftime('%d.%m.%Y'), "14:00")
print(f"Sending test SMS with real template to {phone}...\n{msg}")

url = f"{eskiz_service.base_url}/message/sms/send"
headers = {
    'Authorization': f'Bearer {token}'
}
payload = {
    'mobile_phone': phone,
    'message': msg,
    'from': '4546',
}

try:
    response = requests.post(url, headers=headers, data=payload, timeout=10)
    print(f"HTTP Status: {response.status_code}")
    print(f"API Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ SMS test passed!")
        data = response.json()
        if 'id' in data:
            print(f"✅ Message ID: {data['id']}")
    else:
        print("❌ SMS test failed with HTTP", response.status_code)
except Exception as e:
    print(f"❌ Exception during SMS send: {e}")

print("\n--- 3. Checking Celery Tasks Configuration ---")
from core.settings import CELERY_BEAT_SCHEDULE
print("Configured Beat Schedules:")
for k, v in CELERY_BEAT_SCHEDULE.items():
    print(f" - {k}: {v['schedule']} -> {v['task']}")

print("\n--- 4. Creating Test Appointment ---")
try:
    from appointments.serializers import AppointmentSerializer
    from users.models import User
    
    doctor = User.objects.filter(role='DOCTOR').first()
    if patient and doctor:
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(minutes=30)
        
        appt_data = {
            'patient': patient.id,
            'doctor': doctor.id,
            'start_time': start_time,
            'end_time': end_time,
            'status': 'BOOKED'
        }
        serializer = AppointmentSerializer(data=appt_data)
        if serializer.is_valid():
            print("✅ Serializer is valid. The on_commit hook will trigger send_registration_sms_task.")
            # Мы не сохраняем в БД, чтобы не мусорить, но код валидации работает.
        else:
            print(f"❌ Validation failed: {serializer.errors}")
except Exception as e:
    print(f"❌ Exception during appointment test: {e}")
