import logging
logger = logging.getLogger(__name__)

from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, F, Q
from django.utils import timezone
from datetime import timedelta
from .models import Service, Appointment, ServiceMaterialNorm, TreatmentPlan, TreatmentPlanItem
from .serializers import (
    ServiceSerializer, AppointmentSerializer, ServiceMaterialNormSerializer,
    TreatmentPlanSerializer, TreatmentPlanItemSerializer
)
from patients.models import Patient

import logging
logger = logging.getLogger(__name__)


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by('name_ru')
    serializer_class = ServiceSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class ServiceMaterialNormViewSet(viewsets.ModelViewSet):
    """Управление нормами расхода материалов для услуг."""
    queryset = ServiceMaterialNorm.objects.all().select_related('service', 'material')
    serializer_class = ServiceMaterialNormSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['service', 'material']


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('-start_time')
    serializer_class = AppointmentSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'available_slots']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Appointment.objects.all().order_by('-start_time').select_related('patient', 'doctor', 'service')
        start_date = self.request.query_params.get('start_date') # e.g. YYYY-MM-DD
        end_date = self.request.query_params.get('end_date')
        doctor_id = self.request.query_params.get('doctor')
        
        if start_date:
            queryset = queryset.filter(start_time__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_time__date__lte=end_date)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
            
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # If appointment is created by public user, patient details are provided as text
        patient_id = data.get('patient')
        if not patient_id:
            first_name = data.get('patient_first_name', '')
            last_name = data.get('patient_last_name', '')
            phone = data.get('patient_phone', '')
            birth_date = data.get('patient_birth_date')
            
            if not phone:
                return Response({"error": "Телефон обязателен для записи"}, status=status.HTTP_400_BAD_REQUEST)
                
            import re
            phone = re.sub(r'\D', '', phone)
                
            # Lookup or create patient by phone number
            patient, created = Patient.objects.get_or_create(
                phone=phone,
                defaults={
                    'first_name': first_name or 'Новый',
                    'last_name': last_name or 'Пациент',
                    'birth_date': birth_date or '2000-01-01',
                    'gender': Patient.Gender.MALE
                }
            )
            # If patient already existed, optionally update their birth_date if not set to default
            if not created and birth_date and patient.birth_date == '2000-01-01':
                patient.birth_date = birth_date
                patient.save()
                
            data['patient'] = patient.id
            
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        sms_status = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        response_data = serializer.data
        response_data['sms_status'] = sms_status
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        appointment = serializer.save()
        
        # Запускаем отправку SMS после коммита в БД
        from django.db import transaction
        from core.tasks import send_registration_sms_task, send_telegram_message_async
        def safe_send_sms():
            try:
                result = send_registration_sms_task(appointment.id)
                logger.info(f"SMS Task Result: {result}")
                return result
            except Exception as e:
                logger.warning(f"SMS notification failed: {e}")
                return str(e)
                
        sms_status = safe_send_sms()
        
        # Auto-record income transaction when appointment is created as COMPLETED
        if appointment.status == 'COMPLETED':
            try:
                from finance.models import Transaction
                if not Transaction.objects.filter(appointment=appointment, is_voided=False).exists():
                    amount = appointment.custom_price or (appointment.service.price if appointment.service else 0)
                    if amount and amount > 0:
                        service_title = appointment.custom_service_name or (appointment.service.name_ru if appointment.service else 'Медицинская услуга')
                        Transaction.objects.create(
                            appointment=appointment,
                            patient=appointment.patient,
                            amount=amount,
                            transaction_type='INCOME',
                            description=f"Автоматическая оплата: {service_title}",
                            payment_method='CASH',
                            created_by=self.request.user if hasattr(self.request, 'user') and self.request.user.is_authenticated else None
                        )
            except Exception as e:
                logger.error(f"Failed to auto-create transaction for completed appointment: {e}")

        # Send telegram notification for new booking
        sms_status = None
        try:
            from core.tasks import send_telegram_message_async
            service_name = appointment.custom_service_name or (appointment.service.name_ru if appointment.service else 'Консультация')
            message = (
                f"🆕 <b>Новая запись на прием!</b>\n\n"
                f"Пациент: <b>{appointment.patient}</b>\n"
                f"Врач: <b>{appointment.doctor}</b>\n"
                f"Услуга: {service_name}\n"
                f"Время: <b>{appointment.start_time.strftime('%d.%m.%Y %H:%M')}</b>\n"
                f"Заметки: {appointment.notes or 'нет'}"
            )
            reply_markup = {
                "inline_keyboard": [[
                    {"text": "✅ Подтвердить", "callback_data": f"confirm_{appointment.id}"},
                    {"text": "📞 Перезвонить", "callback_data": f"call_{appointment.id}"}
                ]]
            }
            send_telegram_message_async(message, reply_markup=reply_markup)

            # Direct reminder notification to the patient if chat_id exists
            if appointment.patient.telegram_chat_id:
                patient_message = (
                    f"Здравствуйте, {appointment.patient.first_name}! 👋\n\n"
                    f"Вы успешно записаны на прием в клинику <b>Shark Denta</b>:\n"
                    f"👨‍⚕️ Врач: <b>{appointment.doctor}</b>\n"
                    f"🩺 Услуга: {service_name}\n"
                    f"📅 Дата и время: <b>{appointment.start_time.strftime('%d.%m.%Y в %H:%M')}</b>\n\n"
                    f"Ждем вас! Пожалуйста, приходите за 10 минут до начала приёма."
                )
                send_telegram_message_async(patient_message, to_chat_id=appointment.patient.telegram_chat_id)
        except Exception as e:
            logger.warning(f"Telegram notification failed (Celery/Redis may not be running): {e}")

        return sms_status

    def perform_update(self, serializer):
        old_appointment = self.get_object()
        old_status = old_appointment.status
        old_time = old_appointment.start_time
        appointment = serializer.save()
        
        from core.tasks import send_telegram_message_async

        # Auto-record income transaction when appointment status becomes COMPLETED
        if appointment.status == 'COMPLETED':
            try:
                from finance.models import Transaction
                if not Transaction.objects.filter(appointment=appointment, is_voided=False).exists():
                    amount = appointment.custom_price or (appointment.service.price if appointment.service else 0)
                    if amount and amount > 0:
                        service_title = appointment.custom_service_name or (appointment.service.name_ru if appointment.service else 'Медицинская услуга')
                        Transaction.objects.create(
                            appointment=appointment,
                            patient=appointment.patient,
                            amount=amount,
                            transaction_type='INCOME',
                            description=f"Автоматическая оплата: {service_title}",
                            payment_method='CASH',
                            created_by=self.request.user if hasattr(self.request, 'user') and self.request.user.is_authenticated else None
                        )
            except Exception as e:
                logger.error(f"Failed to auto-create transaction for completed appointment: {e}")

            message = (
                f"🔔 <b>Статус записи изменен!</b>\n\n"
                f"Пациент: <b>{appointment.patient}</b>\n"
                f"Врач: <b>{appointment.doctor}</b>\n"
                f"Время: {appointment.start_time.strftime('%d.%m.%Y %H:%M')}\n"
                f"Старый статус: {old_status}\n"
                f"Новый статус: <b>{appointment.get_status_display()}</b>"
            )
            send_telegram_message_async(message)

        # Notify patient directly if chat_id exists and status or time changed
        if appointment.patient.telegram_chat_id:
            status_changed = old_status != appointment.status
            time_changed = old_time != appointment.start_time
            
            if status_changed or time_changed:
                service_name = appointment.service.name_ru if appointment.service else 'Консультация'
                
                status_label = {
                    'BOOKED': 'Подтвержден',
                    'ARRIVED': 'Вы пришли в клинику',
                    'COMPLETED': 'Завершен',
                    'CANCELED': 'Отменен ❌'
                }.get(appointment.status, appointment.status)

                patient_msg = (
                    f"🔔 <b>Обновление по вашему приёму!</b>\n\n"
                    f"Пациент: {appointment.patient.first_name}\n"
                    f"👨‍⚕️ Врач: {appointment.doctor}\n"
                    f"📅 Время: <b>{appointment.start_time.strftime('%d.%m.%Y в %H:%M')}</b>\n"
                    f"📌 Статус: <b>{status_label}</b>"
                )
                send_telegram_message_async(patient_msg, to_chat_id=appointment.patient.telegram_chat_id)

    # ─── Booking Endpoints ────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='available-slots')
    def available_slots(self, request):
        """
        Возвращает доступные слоты (30 минут) для выбранного врача на определённую дату.
        Параметры: doctor_id, date (YYYY-MM-DD)
        """
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')

        if not doctor_id or not date_str:
            return Response({"error": "Укажите doctor_id и date"}, status=400)

        from datetime import datetime, timedelta
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Неверный формат даты"}, status=400)

        # TODO: Get doctor's actual working hours from User model. Using default 08:00 - 00:00
        start_time = datetime.combine(target_date, datetime.strptime('08:00', '%H:%M').time())
        end_time = datetime.combine(target_date + timedelta(days=1), datetime.strptime('00:00', '%H:%M').time())

        # Get existing appointments for the doctor on that date
        existing_appts = Appointment.objects.filter(
            doctor_id=doctor_id,
            start_time__date=target_date,
            status__in=['BOOKED', 'ARRIVED']
        ).exclude(status='CANCELED')

        slots = []
        current = start_time
        
        while current + timedelta(minutes=30) <= end_time:
            slot_end = current + timedelta(minutes=30)
            
            # Check for overlap
            is_booked = False
            for appt in existing_appts:
                # If current slot overlaps with existing appt
                # Note: timezone might need to be considered if appt is timezone aware
                # Making existing appt start/end naive for simple comparison if they are in local timezone
                appt_start = timezone.localtime(appt.start_time).replace(tzinfo=None)
                appt_end = timezone.localtime(appt.end_time).replace(tzinfo=None)
                if current < appt_end and slot_end > appt_start:
                    is_booked = True
                    break
            
            if not is_booked:
                # Skip past slots if the date is today
                now_tashkent = timezone.localtime()
                if target_date == now_tashkent.date() and current.time() < now_tashkent.time():
                    pass
                else:
                    slots.append(current.strftime('%H:%M'))
                
            current += timedelta(minutes=30)
            
        return Response(slots)

    # ─── Analytics Endpoints ────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='analytics/monthly-revenue')
    def monthly_revenue(self, request):
        """Выручка по месяцам за последние 12 месяцев (на основе завершённых приёмов)."""
        from finance.models import Transaction
        from patients.models import Patient
        now = timezone.now()
        twelve_months_ago = now - timedelta(days=365)

        total_all_time_income = Transaction.objects.filter(transaction_type='INCOME').aggregate(total=Sum('amount'))['total'] or 0
        total_patients = Patient.objects.count()
        ltv = float(total_all_time_income) / total_patients if total_patients > 0 else 0

        months_data = []
        for i in range(12):
            month_start = (now - timedelta(days=30 * (11 - i))).replace(day=1)
            if i < 11:
                month_end = (now - timedelta(days=30 * (10 - i))).replace(day=1)
            else:
                month_end = now

            income = Transaction.objects.filter(
                transaction_type='INCOME',
                created_at__gte=month_start,
                created_at__lt=month_end
            ).aggregate(total=Sum('amount'))['total'] or 0

            appointments_count = Appointment.objects.filter(
                status='COMPLETED',
                end_time__gte=month_start,
                end_time__lt=month_end
            ).count()
            average_ticket = float(income) / appointments_count if appointments_count > 0 else 0

            months_data.append({
                'month': month_start.strftime('%Y-%m'),
                'month_label': month_start.strftime('%b %Y'),
                'revenue': float(income),
                'average_ticket': round(average_ticket, 2)
            })

        return Response({
            "months": months_data,
            "ltv": round(ltv, 2)
        })

    @action(detail=False, methods=['get'], url_path='analytics/top-services')
    def top_services(self, request):
        """Самые популярные и прибыльные услуги."""
        appts = Appointment.objects.exclude(status='CANCELED').select_related('service')
        
        services_count = {}
        for appt in appts:
            name = appt.custom_service_name or (appt.service.name_ru if appt.service else None)
            if not name:
                continue
            price = float(appt.custom_price or (appt.service.price if appt.service else 0))
            if name not in services_count:
                services_count[name] = {'name': name, 'count': 0, 'total_revenue': 0.0, 'price': price}
            services_count[name]['count'] += 1
            services_count[name]['total_revenue'] += price

        sorted_services = sorted(services_count.values(), key=lambda x: x['count'], reverse=True)[:10]
        return Response([
            {
                'id': idx + 1,
                'name': s['name'],
                'price': s['price'],
                'count': s['count'],
                'total_revenue': s['total_revenue']
            }
            for idx, s in enumerate(sorted_services)
        ])

    @action(detail=False, methods=['get'], url_path='analytics/doctor-kpi')
    def doctor_kpi(self, request):
        """KPI врачей: выручка, количество приёмов и расчёт зарплаты за период."""
        from users.models import User

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        doctors = User.objects.filter(role='DOCTOR')
        result = []

        for doctor in doctors:
            qs = Appointment.objects.filter(doctor=doctor)
            if start_date:
                qs = qs.filter(start_time__date__gte=start_date)
            if end_date:
                qs = qs.filter(start_time__date__lte=end_date)

            total_count = qs.count()
            completed_count = qs.filter(status='COMPLETED').count()
            canceled_count = qs.filter(status='CANCELED').count()
            
            cancellation_rate = (canceled_count / total_count * 100) if total_count > 0 else 0

            from django.db.models.functions import Coalesce

            total_revenue = qs.filter(status='COMPLETED').aggregate(
                total=Sum(Coalesce('custom_price', 'service__price', output_field=models.DecimalField()))
            )['total'] or 0

            kpi_bonus = float(total_revenue) * float(doctor.kpi_percentage) / 100
            total_salary = float(doctor.salary) + kpi_bonus

            result.append({
                'id': doctor.id,
                'name': f"{doctor.last_name} {doctor.first_name}",
                'specialization': doctor.specialization or '',
                'total_appointments': total_count,
                'completed_appointments': completed_count,
                'canceled_appointments': canceled_count,
                'cancellation_rate': round(cancellation_rate, 2),
                'total_revenue': float(total_revenue),
                'base_salary': float(doctor.salary),
                'kpi_percentage': float(doctor.kpi_percentage),
                'kpi_bonus': round(kpi_bonus, 2),
                'total_salary': round(total_salary, 2),
            })

        return Response(result)


class TreatmentPlanViewSet(viewsets.ModelViewSet):
    """Планы лечения."""
    queryset = TreatmentPlan.objects.all().order_by('-created_at')
    serializer_class = TreatmentPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'doctor', 'status']

    def get_queryset(self):
        from django.db.models import Sum, Count, Case, When, IntegerField
        from django.db.models.functions import Coalesce
        
        qs = super().get_queryset().prefetch_related('items')
        qs = qs.annotate(
            total_price_annotated=Coalesce(Sum('items__price'), 0.0, output_field=models.DecimalField()),
            total_items_count_annotated=Count('items'),
            completed_items_count_annotated=Count(
                Case(When(items__is_completed=True, then=1), output_field=IntegerField())
            )
        )
        return qs


class TreatmentPlanItemViewSet(viewsets.ModelViewSet):
    """Этапы плана лечения."""
    queryset = TreatmentPlanItem.objects.all()
    serializer_class = TreatmentPlanItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['plan', 'is_completed']

    @action(detail=True, methods=['post'], url_path='toggle-complete')
    def toggle_complete(self, request, pk=None):
        """Переключает статус выполнения этапа."""
        item = self.get_object()
        item.is_completed = not item.is_completed
        item.completed_at = timezone.now() if item.is_completed else None
        item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data)
