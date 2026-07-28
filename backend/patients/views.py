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
    queryset = DentalRecord.objects.all().select_related('patient')
    serializer_class = DentalRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'tooth_number']

class PatientFileViewSet(viewsets.ModelViewSet):
    queryset = PatientFile.objects.all().order_by('-uploaded_at').select_related('patient')
    serializer_class = PatientFileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient']

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import logging

logger = logging.getLogger(__name__)

class EskizWebhookView(APIView):
    """
    Webhook для приема статусов от Eskiz SMS.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            data = request.data
            # Eskiz sends data in form or json, DRF parses both
            request_id = data.get('request_id')
            status_code = data.get('status')
            
            if not request_id or not status_code:
                return Response({"error": "Missing required fields"}, status=400)
                
            from .models import SMSLog
            sms_log = SMSLog.objects.filter(eskiz_message_id=request_id).first()
            if not sms_log:
                return Response({"error": "SMSLog not found"}, status=404)
                
            status_upper = str(status_code).upper()
            if status_upper in ['DELIVRD', 'DELIVERED']:
                sms_log.status = SMSLog.Status.SUCCESS
            elif status_upper in ['EXPIRED', 'UNDELIV', 'REJECTD', 'FAILED', 'ERROR']:
                sms_log.status = SMSLog.Status.FAILED
            
            # Save the callback payload
            if isinstance(sms_log.response_data, dict):
                sms_log.response_data['callback_update'] = data
            else:
                sms_log.response_data = {'original': sms_log.response_data, 'callback_update': data}
                
            sms_log.save(update_fields=['status', 'response_data'])
            return Response({"success": True})
        except Exception as e:
            logger.error(f"Eskiz webhook error: {e}")
            return Response({"error": str(e)}, status=500)

