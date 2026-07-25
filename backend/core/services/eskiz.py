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

    def send_sms(self, phone: str, text: str) -> bool:
        """
        Универсальный метод отправки SMS.
        """
        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        if not clean_phone:
            logger.error("Invalid phone number provided.")
            return False
            
        token = self._get_token()
        if not token:
            logger.error(f"Cannot send SMS to {clean_phone}: No auth token.")
            return False

        success = self._send_request(clean_phone, text, token)
        
        # Если 401 Unauthorized, обновляем токен и пробуем снова
        if not success:
            logger.info("Retrying SMS send with new token...")
            new_token = self.refresh_token()
            if new_token:
                success = self._send_request(clean_phone, text, new_token)
                
        return success

    def _send_request(self, phone: str, message: str, token: str) -> bool:
        url = f"{self.base_url}/message/sms/send"
        headers = {
            'Authorization': f'Bearer {token}'
        }
        payload = {
            'mobile_phone': phone,
            'message': message,
            'from': '4546',
        }

        try:
            response = requests.post(url, headers=headers, data=payload, timeout=10)
            
            if response.status_code == 401:
                return False
                
            response.raise_for_status()
            logger.info(f"Successfully sent SMS to {phone}. Response: {response.json()}")
            return True
        except requests.exceptions.RequestException as e:
            code = e.response.status_code if e.response is not None else None
            logger.error(f"Failed to send SMS to {phone}. Code: {code}. Error: {e}")
            if code == 401:
                return False
            return False

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
        return self.send_sms(patient.phone, msg)

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
        success = self.send_sms(patient.phone, msg)
        if success:
            # Отмечаем, что напоминание отправлено (храним долго, чтобы не дублировать)
            cache.set(duplicate_key, True, timeout=60 * 60 * 24 * 7)
        return success

    def send_birthday_sms(self, patient) -> bool:
        """
        Отправка поздравительного SMS в день рождения.
        """
        if not patient.phone:
            return False
            
        # Защита от дублей (одна отправка в год)
        current_year = timezone.now().year
        duplicate_key = f"birthday_sms_sent_{patient.id}_{current_year}"
        if cache.get(duplicate_key):
            logger.info(f"Birthday SMS already sent to {patient.id} this year")
            return False

        msg = get_birthday_message(patient)
        success = self.send_sms(patient.phone, msg)
        if success:
            cache.set(duplicate_key, True, timeout=60 * 60 * 24 * 365)
        return success

# Экземпляр сервиса
eskiz_service = EskizSMSService()
