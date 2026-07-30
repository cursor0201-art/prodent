from django.apps import AppConfig
from django.db.models.signals import post_migrate

def sync_passwords(sender, **kwargs):
    try:
        from .models import User
        passwords_map = {
            'dr_farrukh': 'Prodent2026_Farrukh',
            'dr_bekzod': 'Prodent2026_Bekzod',
            'dr_shokhrukh': 'Prodent2026_Shokhrukh',
            'dr_mirzoubay': 'Prodent2026_Mirzo',
            'admin': 'admin123'
        }
        for username, pwd in passwords_map.items():
            user = User.objects.filter(username=username).first()
            if user and not user.check_password(pwd):
                user.set_password(pwd)
                user.save(update_fields=['password'])
    except Exception:
        pass

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        post_migrate.connect(sync_passwords, sender=self)
