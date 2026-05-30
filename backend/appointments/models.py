from django.db import models
from django.conf import settings


class Service(models.Model):
    name_ru = models.CharField(max_length=200)
    name_uz = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    duration_minutes = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name_ru


class ServiceMaterialNorm(models.Model):
    """Нормы расхода материалов на услугу.
    Например, для услуги 'Пломба' автоматически списывается 1 ед. композита.
    """
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='material_norms')
    material = models.ForeignKey('inventory.Material', on_delete=models.CASCADE, related_name='service_norms')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.00)

    class Meta:
        unique_together = ('service', 'material')

    def __str__(self):
        return f"{self.service.name_ru} → {self.material.name} ({self.quantity} {self.material.unit})"


class Appointment(models.Model):
    class Status(models.TextChoices):
        BOOKED = 'BOOKED', 'Booked'
        ARRIVED = 'ARRIVED', 'Arrived'
        CANCELED = 'CANCELED', 'Canceled'
        COMPLETED = 'COMPLETED', 'Completed'

    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_appointments', limit_choices_to={'role': 'DOCTOR'})
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BOOKED, db_index=True)
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} - {self.doctor} at {self.start_time}"


class TreatmentPlan(models.Model):
    """Комплексный план лечения пациента (например, 'Имплантация под ключ')."""
    class PlanStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Черновик'
        ACTIVE = 'ACTIVE', 'Активный'
        COMPLETED = 'COMPLETED', 'Завершён'
        CANCELLED = 'CANCELLED', 'Отменён'

    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='treatment_plans')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='treatment_plans')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=PlanStatus.choices, default=PlanStatus.DRAFT)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_price(self):
        """Общая стоимость плана без скидки."""
        if hasattr(self, 'total_price_annotated'):
            return self.total_price_annotated
        total = sum(item.price for item in self.items.all())
        return total

    @property
    def discounted_price(self):
        """Общая стоимость со скидкой."""
        total = self.total_price
        if self.discount_percent > 0:
            total = total * (1 - self.discount_percent / 100)
        return round(total, 2)

    @property
    def completed_items_count(self):
        if hasattr(self, 'completed_items_count_annotated'):
            return self.completed_items_count_annotated
        return self.items.filter(is_completed=True).count()

    @property
    def total_items_count(self):
        if hasattr(self, 'total_items_count_annotated'):
            return self.total_items_count_annotated
        return self.items.count()

    @property
    def progress_percent(self):
        total = self.total_items_count
        if total == 0:
            return 0
        return round((self.completed_items_count / total) * 100)

    def __str__(self):
        return f"План: {self.title} — {self.patient}"


class TreatmentPlanItem(models.Model):
    """Отдельный этап в плане лечения."""
    plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name='items')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    tooth_number = models.IntegerField(blank=True, null=True)  # Опционально: конкретный зуб
    custom_name = models.CharField(max_length=300, blank=True, null=True)  # Если услуга не из списка
    price = models.DecimalField(max_digits=12, decimal_places=2)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)
    order = models.IntegerField(default=0)  # Порядок выполнения этапов
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        name = self.custom_name or (self.service.name_ru if self.service else "Этап")
        return f"{name} — {self.price} UZS"
