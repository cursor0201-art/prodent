from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
        ADMIN = 'ADMIN', 'Administrator'
        DOCTOR = 'DOCTOR', 'Doctor'
        CASHIER = 'CASHIER', 'Cashier'
        OPERATOR = 'OPERATOR', 'Operator'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ADMIN
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    kpi_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) # Процент от выполненных услуг
    working_hours = models.JSONField(blank=True, null=True) # расписание: {"Monday": ["09:00", "18:00"], ...}

    def __str__(self):
        full_name = f"{self.last_name} {self.first_name}" if self.first_name or self.last_name else self.username
        return f"{full_name} ({self.role})"

