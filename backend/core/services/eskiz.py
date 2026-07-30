import os
import logging
import requests
from django.core.cache import cache
from django.utils import timezone
from core.services.sms_templates import get_registration_message, get_reminder_message, get_birthday_message

logger = logging.getLogger(__name__)

class EskizSMSService:
    def __init__(self):
        self.email = os.environ.get('ESKIZ_EMAIL')
        self.password = os.environ.get('ESKIZ_SECRET_KEY')
        self.sender = os.environ.get('ESKIZ_SENDER', '4546')
        self.base_url = os.environ.get('ESKIZ_BASE_URL', 'https://notify.eskiz.uz/api')
        self.cache_key = 'eskiz_sms_token'

    def login(self) -> str:
        """
        Первичная авторизация. По сути синоним refresh_token.
        """
        return self.refresh_token()

    def refresh_token(self) -> str:
        """
        Авторизация и получение нового токена от Eskiz.
        """
        if not self.email or not self.password:
            logger.error("Eskiz credentials (ESKIZ_EMAIL, ESKIZ_SECRET_KEY) are not set in ENV.")
            return ""

        url = f"{self.base_url}/auth/login"
        payload = {
            'email': self.email,
            'password': self.password
        }

        try:
            response = requests.post(url, data=payload, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            token = data.get('data', {}).get('token')
            if token:
                # Сохраняем токен в кэше на 29 дней (Eskiz токен живет 30 дней)
                cache.set(self.cache_key, token, timeout=60 * 60 * 24 * 29)
                logger.info("Successfully received new token from Eskiz.")
                return token
            else:
                logger.error(f"Eskiz auth failed: No token in response. {data}")
                return ""
        except requests.exceptions.RequestException as e:
            logger.error(f"Eskiz auth request failed: {e}")
            return ""

    def _get_token(self) -> str:
        token = cache.get(self.cache_key)
        if token:
            return token
        return self.refresh_token()

    def send_sms(self, phone: str, text: str, sms_type: str = 'general', patient=None) -> bool:
        """
        Универсальный метод отправки SMS с сохранением в SMSLog.
        """
        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        if len(clean_phone) == 9:
            clean_phone = '998' + clean_phone
            
        if not clean_phone:
            logger.error("Invalid phone number provided.")
            self._log_sms(patient=patient, phone=phone, sms_type=sms_type, message=text, status='failed', response_data={'error': 'Invalid phone number'})
            return False
            
        token = self._get_token()
        if not token:
            logger.error(f"Cannot send SMS to {clean_phone}: No auth token.")
            self._log_sms(patient=patient, phone=clean_phone, sms_type=sms_type, message=text, status='failed', response_data={'error': 'No auth token'})
            return False

        success = self._send_request(clean_phone, text, token, sms_type=sms_type, patient=patient)
        
        # Если 401 Unauthorized, обновляем токен и пробуем снова
        if not success:
            logger.info("Retrying SMS send with new token...")
            new_token = self.refresh_token()
            if new_token:
                success = self._send_request(clean_phone, text, new_token, sms_type=sms_type, patient=patient)
                
        return success

    def _send_request(self, phone: str, message: str, token: str, sms_type: str = 'general', patient=None) -> bool:
        url = f"{self.base_url}/message/sms/send"
        headers = {
            'Authorization': f'Bearer {token}'
        }
        payload = {
            'mobile_phone': phone,
            'message': message,
            'from': self.sender,
        }

        try:
            response = requests.post(url, headers=headers, data=payload, timeout=10)
            
            if response.status_code == 401:
                return False
                
            response_data = response.json() if response.content else {}
            eskiz_id = response_data.get('id') or response_data.get('data', {}).get('id')
            
            # Since Eskiz returns 'waiting' synchronously, we log it as waiting.
            # Webhook will update it to success (delivered) later.
            status_str = 'waiting' if response.ok else 'failed'

            self._log_sms(
                patient=patient,
                phone=phone,
                sms_type=sms_type,
                message=message,
                status=status_str,
                eskiz_message_id=str(eskiz_id) if eskiz_id else None,
                response_data=response_data
            )

            response.raise_for_status()
            logger.info(f"Successfully sent SMS to {phone}. Response: {response_data}")
            return True
        except requests.exceptions.RequestException as e:
            code = e.response.status_code if e.response is not None else None
            response_text = e.response.text if e.response is not None else "No response body"
            resp_json = e.response.json() if (e.response is not None and e.response.content) else {'error': str(e)}
            
            if code != 401:
                self._log_sms(
                    patient=patient,
                    phone=phone,
                    sms_type=sms_type,
                    message=message,
                    status='failed',
                    response_data=resp_json
                )
            
            logger.error(f"Failed to send SMS to {phone}. Code: {code}. Response: {response_text}. Error: {e}")
            if code == 401:
                return False
            return False

    def _log_sms(self, patient, phone, sms_type, message, status, eskiz_message_id=None, response_data=None):
        try:
            from patients.models import SMSLog
            SMSLog.objects.create(
                patient=patient,
                phone=phone,
                sms_type=sms_type,
                message=message,
                status=status,
                eskiz_message_id=eskiz_message_id,
                response_data=response_data
            )
        except Exception as log_err:
            logger.error(f"Failed to create SMSLog: {log_err}")

    def send_registration_sms(self, appointment) -> bool:
        """
        Отправка SMS при успешной записи.
        """
        patient = appointment.patient
        if not patient.phone:
            return False
            
        local_time = timezone.localtime(appointment.start_time)
        msg = get_registration_message(
            patient=patient,
            date=local_time.strftime('%d.%m.%Y'),
            time_str=local_time.strftime('%H:%M')
        )
        return self.send_sms(patient.phone, msg, sms_type='registration', patient=patient)

    def send_reminder_sms(self, appointment) -> bool:
        """
        Отправка SMS за 1 час до приема.
        """
        patient = appointment.patient
        if not patient.phone:
            return False
            
        # Защита от дублей
        duplicate_key = f"reminder_sms_sent_{appointment.id}"
        if cache.get(duplicate_key):
            logger.info(f"Reminder SMS already sent for appointment {appointment.id}")
            return False

        local_time = timezone.localtime(appointment.start_time)
        msg = get_reminder_message(
            patient=patient,
            date=local_time.strftime('%d.%m.%Y'),
            time_str=local_time.strftime('%H:%M')
        )
        success = self.send_sms(patient.phone, msg, sms_type='reminder', patient=patient)
        if success:
            cache.set(duplicate_key, True, timeout=60 * 60 * 24 * 7)
        return success

    def send_birthday_sms(self, patient) -> bool:
        """
        Отправка поздравительного SMS в день рождения.
        """
        if not patient.phone:
            return False
            
        current_year = timezone.now().year
        duplicate_key = f"birthday_sms_sent_{patient.id}_{current_year}"
        if cache.get(duplicate_key):
            logger.info(f"Birthday SMS already sent to {patient.id} this year")
            return False

        msg = get_birthday_message(patient)
        success = self.send_sms(patient.phone, msg, sms_type='birthday', patient=patient)
        if success:
            cache.set(duplicate_key, True, timeout=60 * 60 * 24 * 365)
        return success

# Экземпляр сервиса
eskiz_service = EskizSMSService()

