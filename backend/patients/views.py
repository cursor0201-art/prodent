from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Patient, DentalRecord, PatientFile
from .serializers import PatientSerializer, DentalRecordSerializer, PatientFileSerializer
from core.permissions import IsDoctorOrAdmin

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'patronymic', 'phone']
    filterset_fields = ['gender']

class DentalRecordViewSet(viewsets.ModelViewSet):
    queryset = DentalRecord.objects.all()
    serializer_class = DentalRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'tooth_number']

class PatientFileViewSet(viewsets.ModelViewSet):
    queryset = PatientFile.objects.all().order_by('-uploaded_at')
    serializer_class = PatientFileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient']
