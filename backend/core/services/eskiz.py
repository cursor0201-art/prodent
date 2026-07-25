import os
import logging
import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class EskizSMSService:
    def __init__(self):
        self.email = os.environ.get('ESKIZ_EMAIL')
        self.password = os.environ.get('ESKIZ_SECRET_KEY')
        self.base_url = os.environ.get('ESKIZ_BASE_URL', 'https://notify.eskiz.uz/api')
        self.cache_key = 'eskiz_sms_token'

    def _get_token(self) -> str:
        """
        Получает токен из кэша. Если нет — запрашивает новый.
        """
        token = cache.get(self.cache_key)
        if token:
            return token

        return self._refresh_token()

    def _refresh_token(self) -> str:
        """
        Авторизация и получение нового токена.
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

    def send_sms(self, phone: str, message: str) -> bool:
        """
        Отправляет SMS сообщение.
        Если токен истек (401), обновляет его и повторяет попытку 1 раз.
        """
        # Очищаем номер от лишних символов (оставляем только цифры, убираем +, пробелы и т.д.)
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        token = self._get_token()
        if not token:
            logger.error(f"Cannot send SMS to {clean_phone}: No auth token.")
            return False

        success = self._send_request(clean_phone, message, token)
        
        # Если не авторизован (токен истек)
        if not success:
            logger.info("Retrying SMS send with new token...")
            new_token = self._refresh_token()
            if new_token:
                success = self._send_request(clean_phone, message, new_token)
                
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
                # Токен недействителен
                return False
                
            response.raise_for_status()
            logger.info(f"Successfully sent SMS to {phone}. Response: {response.json()}")
            return True
        except requests.exceptions.RequestException as e:
            code = e.response.status_code if e.response is not None else None
            logger.error(f"Failed to send SMS to {phone}. Code: {code}. Error: {e}")
            # Возвращаем False для 401 чтобы запустить ретрай, для других возвращаем True чтоб не ретраить токен
            if code == 401:
                return False
            return False

# Экземпляр сервиса для импорта
eskiz_service = EskizSMSService()
