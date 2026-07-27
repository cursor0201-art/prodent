from django.contrib import admin
from .models import Patient, DentalRecord, PatientFile, SMSLog

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'last_name', 'first_name', 'phone', 'birth_date', 'gender', 'balance', 'created_at')
    search_fields = ('first_name', 'last_name', 'phone')
    list_filter = ('gender', 'created_at')

@admin.register(SMSLog)
class SMSLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'phone', 'sms_type', 'status', 'eskiz_message_id', 'created_at')
    list_filter = ('sms_type', 'status', 'created_at')
    search_fields = ('phone', 'patient__first_name', 'patient__last_name', 'eskiz_message_id', 'message')
    readonly_fields = ('patient', 'phone', 'sms_type', 'message', 'status', 'eskiz_message_id', 'response_data', 'created_at')

    def has_add_permission(self, request):
        return False
