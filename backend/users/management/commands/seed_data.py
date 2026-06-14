from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Seed initial doctors and admin user into the database'

    def handle(self, *args, **options):
        doctors = [
            {
                'username': 'dr_farrukh',
                'first_name': 'Фаррух Расулович',
                'last_name': 'Хужанов',
                'specialization': 'Ортопед-хирург',
                'bio': 'Ведущий специалист клиники. Огромный опыт работы в ортопедии и сложной хирургии.',
                'working_hours': {"Пн": ["09:00", "18:00"], "Вт": ["09:00", "18:00"], "Ср": ["09:00", "18:00"], "Чт": ["09:00", "18:00"], "Пт": ["09:00", "18:00"]},
            },
            {
                'username': 'dr_bekzod',
                'first_name': 'Бекзод Баймуратович',
                'last_name': 'Мухтаров',
                'specialization': 'Имплантолог-хирург',
                'bio': 'Специалист по дентальной имплантации и костной пластике любой сложности.',
                'working_hours': {"Вт": ["09:00", "18:00"], "Ср": ["09:00", "18:00"], "Чт": ["09:00", "18:00"], "Пт": ["09:00", "18:00"], "Сб": ["09:00", "18:00"]},
            },
            {
                'username': 'dr_shokhrukh',
                'first_name': 'Шохрух Расулович',
                'last_name': 'Хужанов',
                'specialization': 'Терапевт-ортодонт',
                'bio': 'Эксперт в области исправления прикуса и эстетической стоматологии.',
                'working_hours': {"Пн": ["09:00", "18:00"], "Вт": ["09:00", "18:00"], "Ср": ["09:00", "18:00"], "Пт": ["09:00", "18:00"]},
            },
            {
                'username': 'dr_mirzoubay',
                'first_name': 'Мирзоубайдуллохон',
                'last_name': 'Илёсхонов',
                'specialization': 'Терапевт-ортодонт',
                'bio': 'Специализируется на лечении кариеса, пульпита и современных ортодонтических системах.',
                'working_hours': {"Вт": ["09:00", "18:00"], "Ср": ["09:00", "18:00"], "Чт": ["09:00", "18:00"], "Пт": ["09:00", "18:00"], "Сб": ["09:00", "18:00"]},
            },
        ]

        for doc_data in doctors:
            username = doc_data.pop('username')
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'role': User.Role.DOCTOR,
                    'is_staff': False,
                    **doc_data,
                }
            )
            passwords_map = {
                'dr_farrukh': 'Prodent2026_Farrukh',
                'dr_bekzod': 'Prodent2026_Bekzod',
                'dr_shokhrukh': 'Prodent2026_Shokhrukh',
                'dr_mirzoubay': 'Prodent2026_Mirzo'
            }
            pwd = passwords_map.get(username, 'doctor123')
            user.set_password(pwd)
            user.save()

            if created:
                self.stdout.write(self.style.SUCCESS(f'Created doctor: {user} with password {pwd}'))
            else:
                self.stdout.write(self.style.WARNING(f'Updated existing doctor: {user} with password {pwd}'))

        # Ensure admin superuser exists
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', '', 'admin123')
            self.stdout.write(self.style.SUCCESS('Created superuser: admin'))
        else:
            self.stdout.write(self.style.WARNING('Superuser admin already exists'))
