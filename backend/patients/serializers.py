from rest_framework import serializers
from .models import Patient, DentalRecord, PatientFile

class DentalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DentalRecord
        fields = '__all__'

class PatientFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientFile
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    dental_records = DentalRecordSerializer(many=True, read_only=True)
    files = PatientFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'
