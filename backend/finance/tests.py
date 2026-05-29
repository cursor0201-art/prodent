from django.test import TestCase
from django.utils import timezone
from .models import Transaction, Debt
from patients.models import Patient
from users.models import User
from appointments.models import Appointment, Service

class FinanceTestCase(TestCase):
    def setUp(self):
        self.patient = Patient.objects.create(
            first_name="Test",
            last_name="Patient",
            phone="998901234567",
            birth_date="1990-01-01"
        )
        self.doctor = User.objects.create_user(
            username="doctor",
            password="password",
            role="DOCTOR",
            salary=5000,
            kpi_percentage=10
        )
        self.service = Service.objects.create(
            name_ru="Тестовая услуга",
            price=1000
        )
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            service=self.service,
            start_time=timezone.now(),
            end_time=timezone.now() + timezone.timedelta(hours=1),
            status="COMPLETED"
        )

    def test_transaction_creation(self):
        """Test creating an income transaction"""
        transaction = Transaction.objects.create(
            transaction_type='INCOME',
            amount=1000,
            appointment=self.appointment,
            description="Payment for service"
        )
        self.assertEqual(Transaction.objects.count(), 1)
        self.assertEqual(transaction.amount, 1000)

    def test_debt_creation_and_payment(self):
        """Test debt tracking logic"""
        debt = Debt.objects.create(
            patient=self.patient,
            amount=500,
            appointment=self.appointment
        )
        self.assertEqual(Debt.objects.count(), 1)
        self.assertEqual(debt.amount_paid, 0)
        self.assertEqual(debt.status, 'UNPAID')

        # Pay part of debt
        debt.amount_paid = 200
        debt.save()
        self.assertEqual(debt.status, 'PARTIAL')

        # Pay full debt
        debt.amount_paid = 500
        debt.save()
        self.assertEqual(debt.status, 'PAID')
