from django.apps import AppConfig
from django.db.models.signals import post_migrate

def create_default_services(sender, **kwargs):
    try:
        from .models import Service
        services = [
            {'id': 1, 'name_ru': 'Консультация врача', 'name_uz': 'Shifokor maslahati', 'price': 50000, 'duration_minutes': 20},
            {'id': 2, 'name_ru': 'Лечение кариеса', 'name_uz': 'Kariesni davolash', 'price': 350000, 'duration_minutes': 45},
            {'id': 3, 'name_ru': 'Имплант Straumann', 'name_uz': 'Straumann implanti', 'price': 5500000, 'duration_minutes': 90},
            {'id': 4, 'name_ru': 'Проф. чистка', 'name_uz': 'Prof. tozalash', 'price': 400000, 'duration_minutes': 30},
            {'id': 5, 'name_ru': 'Другое лечение', 'name_uz': 'Boshqa muolaja', 'price': 2000000, 'duration_minutes': 60}
        ]
        for s in services:
            Service.objects.update_or_create(id=s['id'], defaults=s)
    except Exception:
        pass

class AppointmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'appointments'

    def ready(self):
        import appointments.signals  # noqa: F401
        post_migrate.connect(create_default_services, sender=self)
