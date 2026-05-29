from rest_framework import serializers
from .models import Service, Appointment, ServiceMaterialNorm, TreatmentPlan, TreatmentPlanItem
from patients.serializers import PatientSerializer
from users.serializers import UserSerializer


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class ServiceMaterialNormSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    service_name = serializers.CharField(source='service.name_ru', read_only=True)

    class Meta:
        model = ServiceMaterialNorm
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    patient_detail = PatientSerializer(source='patient', read_only=True)
    doctor_detail = UserSerializer(source='doctor', read_only=True)
    service_detail = ServiceSerializer(source='service', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'


class TreatmentPlanItemSerializer(serializers.ModelSerializer):
    service_detail = ServiceSerializer(source='service', read_only=True)
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = TreatmentPlanItem
        fields = '__all__'

    def get_display_name(self, obj):
        if obj.custom_name:
            return obj.custom_name
        if obj.service:
            return obj.service.name_ru
        return "Этап лечения"


class TreatmentPlanSerializer(serializers.ModelSerializer):
    items = TreatmentPlanItemSerializer(many=True, read_only=True)
    patient_detail = PatientSerializer(source='patient', read_only=True)
    doctor_detail = UserSerializer(source='doctor', read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    progress_percent = serializers.IntegerField(read_only=True)
    completed_items_count = serializers.IntegerField(read_only=True)
    total_items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = TreatmentPlan
        fields = '__all__'
