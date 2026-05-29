from django.db import models
from django.conf import settings

class Transaction(models.Model):
    class TransactionType(models.TextChoices):
        INCOME = 'INCOME', 'Приход'
        EXPENSE = 'EXPENSE', 'Расход'

    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Наличные'
        CARD = 'CARD', 'Карта'
        INSTALLMENT = 'INSTALLMENT', 'Рассрочка'

    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices,
        default=TransactionType.INCOME
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH
    )
    description = models.TextField(blank=True, null=True)
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employee_transactions'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_transactions'
    )
    is_voided = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def void(self, user):
        """Marks the transaction as voided instead of deleting it."""
        if not self.is_voided:
            self.is_voided = True
            self.description = f"[АННУЛИРОВАНО пользователем {user.username}] {self.description or ''}"
            self.save()
            return True
        return False

    def __str__(self):
        status_str = "[VOIDED] " if self.is_voided else ""
        return f"{status_str}{self.get_transaction_type_display()} - {self.amount} UZS ({self.created_at.strftime('%d.%m.%Y')})"


class Debt(models.Model):
    class DebtStatus(models.TextChoices):
        PENDING = 'PENDING', 'В ожидании'
        PARTIAL = 'PARTIAL', 'Частично оплачен'
        PAID = 'PAID', 'Оплачен'

    patient = models.OneToOneField(
        'patients.Patient',
        on_delete=models.CASCADE,
        related_name='debt_record'
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(
        max_length=20,
        choices=DebtStatus.choices,
        default=DebtStatus.PENDING
    )
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def remaining_amount(self):
        return self.total_amount - self.paid_amount

    def __str__(self):
        return f"Долг {self.patient}: {self.remaining_amount} UZS (Статус: {self.get_status_display()})"
