from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from appointments.models import Service, Appointment
from patients.models import Patient, DentalRecord
from finance.models import Transaction, Debt
from inventory.models import Material, MaterialLog
from django.utils import timezone
from datetime import timedelta, date, datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with dental clinic mock data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # 1. Create Users
        self.stdout.write('Creating users...')
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@prodent.uz',
                'first_name': 'Администратор',
                'last_name': 'Главный',
                'role': User.Role.SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if _:
            admin_user.set_password('adminpass')
            admin_user.save()

        doc_azizov, _ = User.objects.get_or_create(
            username='doctor_azizov',
            defaults={
                'email': 'azizov@prodent.uz',
                'first_name': 'Азиз',
                'last_name': 'Азизов',
                'role': User.Role.DOCTOR,
                'specialization': 'Стоматолог-терапевт',
                'bio': 'Специалист высшей категории с опытом работы более 12 лет. Специализируется на эндодонтии и лечении зубов под микроскопом.',
                'salary': 8000000.00,
                'kpi_percentage': 20.00,
                'working_hours': {
                    "Monday": ["09:00", "18:00"],
                    "Tuesday": ["09:00", "18:00"],
                    "Wednesday": ["09:00", "18:00"],
                    "Thursday": ["09:00", "18:00"],
                    "Friday": ["09:00", "18:00"]
                }
            }
        )
        if _:
            doc_azizov.set_password('doctorpass')
            doc_azizov.save()

        doc_saidov, _ = User.objects.get_or_create(
            username='doctor_saidov',
            defaults={
                'email': 'saidov@prodent.uz',
                'first_name': 'Сардор',
                'last_name': 'Саидов',
                'role': User.Role.DOCTOR,
                'specialization': 'Стоматолог-ортопед',
                'bio': 'Эксперт в области эстетического протезирования, установки ультраниров и коронковых протезов любой сложности.',
                'salary': 12000000.00,
                'kpi_percentage': 15.00,
                'working_hours': {
                    "Tuesday": ["09:00", "18:00"],
                    "Wednesday": ["09:00", "18:00"],
                    "Thursday": ["09:00", "18:00"],
                    "Saturday": ["09:00", "15:00"]
                }
            }
        )
        if _:
            doc_saidov.set_password('doctorpass')
            doc_saidov.save()

        cashier, _ = User.objects.get_or_create(
            username='cashier1',
            defaults={
                'email': 'cashier@prodent.uz',
                'first_name': 'Мадина',
                'last_name': 'Каримова',
                'role': User.Role.CASHIER
            }
        )
        if _:
            cashier.set_password('cashierpass')
            cashier.save()

        operator, _ = User.objects.get_or_create(
            username='operator1',
            defaults={
                'email': 'operator@prodent.uz',
                'first_name': 'Лола',
                'last_name': 'Тураева',
                'role': User.Role.OPERATOR
            }
        )
        if _:
            operator.set_password('operatorpass')
            operator.save()

        # 2. Create Services
        self.stdout.write('Creating services...')
        s1, _ = Service.objects.get_or_create(
            name_ru='Лечение кариеса',
            defaults={
                'name_uz': 'Kariesni davolash',
                'price': 350000.00,
                'duration_minutes': 45
            }
        )
        s2, _ = Service.objects.get_or_create(
            name_ru='Имплантация зуба (под ключ)',
            defaults={
                'name_uz': 'Tish implantatsiyasi (barchasi ichida)',
                'price': 5500000.00,
                'duration_minutes': 90
            }
        )
        s3, _ = Service.objects.get_or_create(
            name_ru='Установка керамического винира',
            defaults={
                'name_uz': 'Keramik vinir o\'rnatish',
                'price': 2000000.00,
                'duration_minutes': 60
            }
        )
        s4, _ = Service.objects.get_or_create(
            name_ru='Профессиональная чистка зубов',
            defaults={
                'name_uz': 'Tishlarni professional tozalash',
                'price': 400000.00,
                'duration_minutes': 30
            }
        )

        # 3. Create Patients
        self.stdout.write('Creating patients...')
        p1, _ = Patient.objects.get_or_create(
            phone='+998901234567',
            defaults={
                'first_name': 'Алишер',
                'last_name': 'Усманов',
                'patronymic': 'Каримович',
                'birth_date': date(1985, 5, 12),
                'gender': Patient.Gender.MALE,
                'address': 'Ташкент, Чиланзарский р-н, кв. 3, д. 15',
                'allergy_info': 'Нет аллергии',
                'balance': 0.00
            }
        )
        p2, _ = Patient.objects.get_or_create(
            phone='+998907654321',
            defaults={
                'first_name': 'Дилноза',
                'last_name': 'Рахимова',
                'patronymic': 'Рустамовна',
                'birth_date': date(1992, 9, 24),
                'gender': Patient.Gender.FEMALE,
                'address': 'Ташкент, Юнусабадский р-н, ул. Осиё, д. 4',
                'allergy_info': 'Аллергия на пенициллин',
                'balance': -500000.00
            }
        )

        # 4. Create Dental Records
        self.stdout.write('Creating dental records...')
        DentalRecord.objects.get_or_create(
            patient=p1,
            tooth_number=16,
            defaults={'condition': 'Кариес', 'notes': 'Требуется пломбирование жевательной поверхности'}
        )
        DentalRecord.objects.get_or_create(
            patient=p1,
            tooth_number=25,
            defaults={'condition': 'Пломбирован', 'notes': 'Композит светового отверждения, установлен в 2025 году'}
        )
        DentalRecord.objects.get_or_create(
            patient=p2,
            tooth_number=11,
            defaults={'condition': 'Отсутствует', 'notes': 'Требуется имплантация'}
        )

        # 5. Create Materials
        self.stdout.write('Creating inventory materials...')
        mat1, _ = Material.objects.get_or_create(
            sku='LIDO-001',
            defaults={
                'name': 'Лидокаин (анестетик) 2%',
                'category': Material.Category.ANESTHESIA,
                'quantity': 50.00,
                'unit': 'амп',
                'min_threshold': 10.00,
                'price_per_unit': 15000.00
            }
        )
        mat2, _ = Material.objects.get_or_create(
            sku='COMP-002',
            defaults={
                'name': 'Светоотверждаемый композит Filtek',
                'category': Material.Category.FILLINGS,
                'quantity': 4.00, # Ниже порога min_threshold!
                'unit': 'шт',
                'min_threshold': 8.00,
                'price_per_unit': 120000.00
            }
        )
        mat3, _ = Material.objects.get_or_create(
            sku='IMP-STR-003',
            defaults={
                'name': 'Имплант Straumann Bone Level',
                'category': Material.Category.IMPLANTS,
                'quantity': 15.00,
                'unit': 'шт',
                'min_threshold': 3.00,
                'price_per_unit': 1500000.00
            }
        )

        # 6. Create Appointments
        self.stdout.write('Creating appointments...')
        today = timezone.localtime(timezone.now())
        
        # Appointment 1 (Completed)
        Appointment.objects.get_or_create(
            patient=p1,
            doctor=doc_azizov,
            start_time=today.replace(hour=9, minute=0, second=0, microsecond=0),
            defaults={
                'end_time': today.replace(hour=9, minute=45, second=0, microsecond=0),
                'status': Appointment.Status.COMPLETED,
                'service': s1,
                'notes': 'Проведено лечение среднего кариеса. Установлена пломба.'
            }
        )
        # Appointment 2 (Arrived)
        Appointment.objects.get_or_create(
            patient=p2,
            doctor=doc_saidov,
            start_time=today.replace(hour=11, minute=0, second=0, microsecond=0),
            defaults={
                'end_time': today.replace(hour=12, minute=0, second=0, microsecond=0),
                'status': Appointment.Status.ARRIVED,
                'service': s3,
                'notes': 'Подготовка зуба под винир, снятие слепков.'
            }
        )
        # Appointment 3 (Booked tomorrow)
        tomorrow = today + timedelta(days=1)
        Appointment.objects.get_or_create(
            patient=p1,
            doctor=doc_saidov,
            start_time=tomorrow.replace(hour=14, minute=0, second=0, microsecond=0),
            defaults={
                'end_time': tomorrow.replace(hour=15, minute=0, second=0, microsecond=0),
                'status': Appointment.Status.BOOKED,
                'service': s4,
                'notes': 'Контрольный осмотр и гигиена'
            }
        )

        # 7. Create Finance Transactions and Debts
        self.stdout.write('Creating finance records...')
        # Transaction 1: Income from Alisher (Completed treatment)
        Transaction.objects.get_or_create(
            patient=p1,
            amount=350000.00,
            transaction_type=Transaction.TransactionType.INCOME,
            defaults={
                'payment_method': Transaction.PaymentMethod.CARD,
                'description': 'Оплата лечения кариеса',
                'created_by': admin_user
            }
        )
        # Transaction 2: Income from Dilnoza (Partial payment for veneers preparation)
        Transaction.objects.get_or_create(
            patient=p2,
            amount=1500000.00,
            transaction_type=Transaction.TransactionType.INCOME,
            defaults={
                'payment_method': Transaction.PaymentMethod.CASH,
                'description': 'Предоплата за установку винира',
                'created_by': admin_user
            }
        )
        # Transaction 3: Expense for buying materials
        Transaction.objects.get_or_create(
            amount=800000.00,
            transaction_type=Transaction.TransactionType.EXPENSE,
            defaults={
                'payment_method': Transaction.PaymentMethod.CASH,
                'description': 'Покупка расходных материалов для склада (лидокаин, перчатки)',
                'created_by': admin_user
            }
        )

        # Create Debt for Dilnoza
        Debt.objects.get_or_create(
            patient=p2,
            defaults={
                'total_amount': 2000000.00,
                'paid_amount': 1500000.00,
                'status': Debt.DebtStatus.PARTIAL
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
