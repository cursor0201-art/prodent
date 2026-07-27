from django.db import models

class Patient(models.Model):
    class Gender(models.TextChoices):
        MALE = 'MALE', 'Мужской'
        FEMALE = 'FEMALE', 'Женский'

    first_name = models.CharField(max_length=100, db_index=True)
    last_name = models.CharField(max_length=100, db_index=True)
    patronymic = models.CharField(max_length=100, blank=True, null=True) # Отчество
    phone = models.CharField(max_length=20, unique=True)
    birth_date = models.DateField()
    gender = models.CharField(max_length=10, choices=Gender.choices)
    address = models.TextField(blank=True, null=True)
    allergy_info = models.TextField(blank=True, null=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) # долг или депозит
    telegram_chat_id = models.CharField(max_length=50, blank=True, null=True, unique=True) # Идентификатор чата в Telegram
    language = models.CharField(max_length=2, choices=[('ru', 'Русский'), ('uz', "O'zbek")], default='ru')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        full_name = f"{self.last_name} {self.first_name}"
        if self.patronymic:
            full_name += f" {self.patronymic}"
        return full_name

class DentalRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='dental_records')
    tooth_number = models.IntegerField() # 11-48 FDI
    condition = models.CharField(max_length=100) # e.g., Healthy, Caries, Missing, Filled, Crown, Implant
    notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('patient', 'tooth_number')

class PatientFile(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='patient_files/')
    title = models.CharField(max_length=200, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title or 'Файл'} для {self.patient}"


class SMSLog(models.Model):
    class SMSType(models.TextChoices):
        REGISTRATION = 'registration', 'Подтверждение записи'
        REMINDER = 'reminder', 'Напоминание о приеме'
        BIRTHDAY = 'birthday', 'Поздравление с днем рождения'
        GENERAL = 'general', 'Общее сообщение'

    class Status(models.TextChoices):
        SUCCESS = 'success', 'Успешно'
        FAILED = 'failed', 'Ошибка'
        WAITING = 'waiting', 'В обработке'

    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='sms_logs')
    phone = models.CharField(max_length=20)
    sms_type = models.CharField(max_length=20, choices=SMSType.choices, default=SMSType.GENERAL)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.WAITING)
    eskiz_message_id = models.CharField(max_length=100, blank=True, null=True)
    response_data = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Журнал SMS'
        verbose_name_plural = 'Журнал SMS'
        ordering = ['-created_at']

    def __str__(self):
        return f"SMS [{self.sms_type}] -> {self.phone} ({self.status})"
