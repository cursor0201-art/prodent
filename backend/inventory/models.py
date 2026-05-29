from django.db import models
from django.conf import settings

class Material(models.Model):
    class Category(models.TextChoices):
        ANESTHESIA = 'ANESTHESIA', 'Анестезия'
        FILLINGS = 'FILLINGS', 'Пломбы'
        INSTRUMENTS = 'INSTRUMENTS', 'Инструменты'
        IMPLANTS = 'IMPLANTS', 'Импланты'
        OTHER = 'OTHER', 'Прочее'

    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    unit = models.CharField(max_length=20, default='шт') # шт, мл, уп и т.д.
    min_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=5.00)
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    expiration_date = models.DateField(blank=True, null=True, help_text='Срок годности материала')

    def __str__(self):
        return f"{self.name} ({self.get_category_display()}) - {self.quantity} {self.unit}"


class MaterialLog(models.Model):
    class LogType(models.TextChoices):
        RESTOCK = 'RESTOCK', 'Пополнение'
        CONSUMPTION = 'CONSUMPTION', 'Расход'
        EXPIRY = 'EXPIRY', 'Списание (просрочено)'
        ADJUSTMENT = 'ADJUSTMENT', 'Корректировка'

    material = models.ForeignKey(
        Material,
        on_delete=models.CASCADE,
        related_name='logs'
    )
    change_qty = models.DecimalField(max_digits=10, decimal_places=2) # может быть отрицательным при расходе
    log_type = models.CharField(
        max_length=20,
        choices=LogType.choices,
        default=LogType.CONSUMPTION
    )
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='material_logs'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        from django.core.exceptions import ValidationError
        if self.pk is None and self.change_qty < 0:
            if self.material.quantity + self.change_qty < 0:
                raise ValidationError(f"Недостаточно материала {self.material.name} на складе. Текущий остаток: {self.material.quantity}.")

    def save(self, *args, **kwargs):
        self.clean()
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            # Update material quantity
            material = self.material
            material.quantity += self.change_qty
            material.save()

            # Check threshold and send notification if below threshold
            if material.quantity <= material.min_threshold:
                from core.tasks import send_telegram_message_async
                message = (
                    f"⚠️ <b>Внимание: Низкий уровень запасов!</b>\n\n"
                    f"Материал: <b>{material.name}</b>\n"
                    f"Категория: {material.get_category_display()}\n"
                    f"Текущий остаток: <b>{material.quantity} {material.unit}</b>\n"
                    f"Порог уведомления: {material.min_threshold} {material.unit}\n\n"
                    f"Рекомендуется произвести пополнение склада."
                )
                send_telegram_message_async.delay(message)

    def __str__(self):
        return f"{self.get_log_type_display()} - {self.material.name} ({self.change_qty} {self.material.unit})"
