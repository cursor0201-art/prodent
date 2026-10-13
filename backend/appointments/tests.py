from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from .models import Appointment, Service
from patients.models import Patient
from users.models import User
from core.tasks import send_appointment_reminders
from core.services.sms_templates import get_registration_message, get_reminder_message

class AppointmentTestCase(TestCase):
    def setUp(self):
        self.patient = Patient.objects.create(
            first_name="John",
            last_name="Doe",
            phone="998900000000",
            birth_date="1990-01-01"
        )
        self.doctor = User.objects.create_user(
            username="doc1",
            password="pwd",
            role="DOCTOR"
        )
        self.service = Service.objects.create(
            name_ru="Consultation",
            price=500
        )

    def test_appointment_creation(self):
        """Test basic appointment creation and default status."""
        appt = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            service=self.service,
            start_time=timezone.now(),
            end_time=timezone.now() + timezone.timedelta(minutes=30)
        )
        self.assertEqual(Appointment.objects.count(), 1)
        self.assertEqual(appt.status, 'BOOKED')
        
    def test_appointment_status_update(self):
        """Test status transitions."""
        appt = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            start_time=timezone.now(),
            end_time=timezone.now() + timezone.timedelta(minutes=30)
        )
        appt.status = 'ARRIVED'
        appt.save()
        self.assertEqual(Appointment.objects.get(id=appt.id).status, 'ARRIVED')

    @patch('core.services.eskiz.eskiz_service.send_reminder_sms', return_value=True)
    def test_day_before_appointment_reminder_sms_is_sent(self, mock_send_reminder_sms):
        """One-day reminder should be sent for appointments booked 24 hours in advance."""
        now = timezone.now()
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            service=self.service,
            start_time=now + timezone.timedelta(days=1),
            end_time=now + timezone.timedelta(days=1, minutes=30),
            status='BOOKED'
        )

        with patch('core.tasks.timezone.now', return_value=now):
            result = send_appointment_reminders()

        self.assertIn('1', result)
        mock_send_reminder_sms.assert_called_once_with(appointment, reminder_minutes=1440)

    @patch('core.services.eskiz.eskiz_service.send_reminder_sms', return_value=True)
    def test_one_hour_reminder_is_sent_when_task_runs_late(self, mock_send_reminder_sms):
        """Minute polling should tolerate scheduler drift around the one-hour mark."""
        now = timezone.now()
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            start_time=now + timezone.timedelta(minutes=59, seconds=20),
            end_time=now + timezone.timedelta(minutes=89, seconds=20),
            status='BOOKED'
        )

        with patch('core.tasks.timezone.now', return_value=now):
            result = send_appointment_reminders()

        self.assertIn('1', result)
        mock_send_reminder_sms.assert_called_once_with(appointment, reminder_minutes=60)

    def test_short_reminder_templates_match_the_actual_offset(self):
        self.patient.language = 'ru'
        thirty_minute_message = get_reminder_message(
            self.patient, '13.10.2026', '17:00', reminder_minutes=30
        )
        ten_minute_message = get_reminder_message(
            self.patient, '13.10.2026', '17:00', reminder_minutes=10
        )

        self.assertIn('30 daqiqa', thirty_minute_message)
        self.assertIn('10 daqiqa', ten_minute_message)

    def test_registration_message_is_uzbek_even_when_patient_language_is_russian(self):
        self.patient.language = 'ru'
        message = get_registration_message(self.patient, '13.10.2026', '17:00')

        self.assertIn('Assalomu alaykum', message)
        self.assertIn('Siz 13.10.2026 kuni', message)
        self.assertNotIn('Здравствуйте', message)
