from django.test import TestCase
from django.utils import timezone
from .models import Appointment, Service
from patients.models import Patient
from users.models import User

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
