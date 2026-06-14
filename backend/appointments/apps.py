from django.apps import AppConfig
import sys

class AppointmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'appointments'

    def ready(self):
        import appointments.signals  # noqa: F401
        try:
            from .models import Service
            services = [
                {'id': 1, 'name_ru': 'Консультация врача', 'name_uz': 'Shifokor maslahati', 'price': 50000, 'duration_minutes': 20},
                {'id': 2, 'name_ru': 'Лечение кариеса (1 зуб)', 'name_uz': 'Kariesni davolash (1 ta tish)', 'price': 350000, 'duration_minutes': 45},
                {'id': 3, 'name_ru': 'Установка керамического винира', 'name_uz': "Keramik vinir o'rnatish", 'price': 2000000, 'duration_minutes': 60},
                {'id': 4, 'name_ru': 'Имплант Straumann (Швейцария)', 'name_uz': 'Straumann implanti (Shveytsariya)', 'price': 5500000, 'duration_minutes': 90},
                {'id': 5, 'name_ru': 'Проф. чистка (две челюсти)', 'name_uz': "Prof. tozalash (ikkala jag')", 'price': 400000, 'duration_minutes': 30}
            ]
            for s in services:
                if not Service.objects.filter(id=s['id']).exists():
                    Service.objects.create(**s)
        except Exception:
            pass
