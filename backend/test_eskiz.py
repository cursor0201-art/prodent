import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from core.services.eskiz import eskiz_service
from core.services.sms_templates import get_registration_message
from appointments.models import Appointment
from patients.models import Patient

patient, _ = Patient.objects.get_or_create(phone='+998990501918', defaults={'first_name': 'Test'})
print("Authenticating...")
token = eskiz_service.refresh_token()
print(f"Token: {token}")

if token:
    print("Generating message...")
    # Just generate the message
    msg = get_registration_message(patient.first_name, "2026-07-29", "15:00")
    print(f"Message to send: {msg}")
    
    print("Sending request...")
    success = eskiz_service._send_request('998990501918', msg, token)
    print(f"Success: {success}")
    
    from patients.models import SMSLog
    log = SMSLog.objects.order_by('-id').first()
    if log:
        print(f"Latest SMSLog response_data: {log.response_data}")
