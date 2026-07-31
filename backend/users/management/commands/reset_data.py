from django.core.management.base import BaseCommand
from appointments.models import Appointment, TreatmentPlan, TreatmentPlanItem
from patients.models import Patient, DentalRecord, PatientFile
from finance.models import Transaction, Debt
from inventory.models import MaterialLog, Material


class Command(BaseCommand):
    help = 'Reset all test patients, appointments, transactions, debts, and inventory logs for live production use'

    def handle(self, *args, **options):
        self.stdout.write("Clearing test data...")
        
        # 1. Clear finance transactions & debts
        Transaction.objects.all().delete()
        Debt.objects.all().delete()
        
        # 2. Clear appointments & treatment plans
        Appointment.objects.all().delete()
        TreatmentPlanItem.objects.all().delete()
        TreatmentPlan.objects.all().delete()
        
        # 3. Clear patients, dental records, files
        DentalRecord.objects.all().delete()
        PatientFile.objects.all().delete()
        Patient.objects.all().delete()
        
        # 4. Clear inventory logs & materials
        MaterialLog.objects.all().delete()
        Material.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS("All test data cleared successfully! Clinic CRM is 100% clean and ready for real operation."))
