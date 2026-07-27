from django.utils import formats

def get_registration_message(patient, date, time_str, address="г. Ташкент, Юнусабадский район.") -> str:
    lang = getattr(patient, 'language', 'ru')
    
    name = f"{patient.first_name} {patient.last_name}".strip()
    
    if lang == 'uz':
        # ID 81265
        address_uz = "Toshkent sh., Yunusobod tumani." if address == "г. Ташкент, Юнусабадский район." else address
        return f"""🦷 Shark Denta

Assalomu alaykum, {name}!

Shark Denta klinikasini tanlaganingiz uchun rahmat.

Siz {date} kuni soat {time_str} ga muvaffaqiyatli yozildingiz.

📍 Manzil: {address_uz}

Savollar bo'lsa, biz bilan bog'laning.

Hurmat bilan,
Shark Denta"""
    
    # ID 81325
    return f"""🦷 Shark Denta

Здравствуйте, {name}!

Спасибо, что выбрали стоматологическую клинику Shark Denta.

Вы успешно записаны на {date} в {time_str}.

📍 Адрес: {address}

Если возникнут вопросы, свяжитесь с нами.

С уважением,
Shark Denta."""

def get_reminder_message(patient, date, time_str, address="г. Ташкент, Юнусабадский район.") -> str:
    lang = getattr(patient, 'language', 'ru')
    
    name = f"{patient.first_name} {patient.last_name}".strip()
    
    if lang == 'uz':
        # ID 81328
        address_uz = "Toshkent sh., Yunusobod tumani." if address == "г. Ташкент, Юнусабадский район." else address
        return f"""🦷 Shark Denta

Assalomu alaykum, {name}!

Sizning qabulingiz boshlanishiga 1 soat qoldi.

📅 {date}
🕐 {time_str}

📍 {address_uz}

Sizni kutamiz!

Hurmat bilan,
Shark Denta"""

    # ID 81327
    return f"""🦷 Shark Denta

Здравствуйте, {name}!

Напоминаем, что до вашего приема остался 1 час.

📅 {date}
🕐 {time_str}

📍 {address}

Ждем Вас!

С уважением,
Shark Denta."""

def get_birthday_message(patient) -> str:
    lang = getattr(patient, 'language', 'ru')
    
    name = f"{patient.first_name} {patient.last_name}".strip()
    
    if lang == 'uz':
        # ID 81267
        return f"""🎉 Shark Denta

Assalomu alaykum, {name}!

Tug'ilgan kuningiz bilan tabriklaymiz!

Sizga sog'liq va baxt tilaymiz.

🎁 Sovg'a sifatida bepul shifokor konsultatsiyasi taqdim etiladi.

Hurmat bilan,
Shark Denta"""

    # ID 81326
    return f"""🎉 Shark Denta

Здравствуйте, {name}!

Поздравляем Вас с Днем рождения!

Желаем крепкого здоровья, счастья и красивой улыбки.

🎁 В подарок — бесплатная консультация врача.

С уважением,
Shark Denta."""
