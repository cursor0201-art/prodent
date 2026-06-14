from django.apps import AppConfig
import sys


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
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
