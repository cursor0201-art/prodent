"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, MapPin, Phone, Send, Check, AlertCircle, MessageCircle, Navigation } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { PatternFormat } from 'react-number-format';

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string;
}

interface Service {
  id: number;
  name_ru: string;
  name_uz: string;
  price: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prodent-hfae.onrender.com';

export const Contact = () => {
  const { t, language } = useLanguage();
  
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [birthDate, setBirthDate] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [notes, setNotes] = useState('');

  // Dropdown Data State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Status State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successPatientId, setSuccessPatientId] = useState<number | null>(null);
  const [error, setError] = useState('');
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Load doctors and services from Django API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, servRes] = await Promise.all([
          axios.get(`${API_URL}/api/users/doctors/`),
          axios.get(`${API_URL}/api/appointments/services/`)
        ]);
        if (docsRes.data && docsRes.data.length > 0) {
          setDoctors(docsRes.data);
        } else {
          throw new Error("No doctors found in DB");
        }
        if (servRes.data && servRes.data.length > 0) {
          setServices(servRes.data);
        } else {
          setServices([
            { id: 1, name_ru: "Консультация врача", name_uz: "Shifokor maslahati", price: "50000.00" },
            { id: 2, name_ru: "Лечение кариеса (1 зуб)", name_uz: "Kariesni davolash (1 ta tish)", price: "350000.00" },
            { id: 3, name_ru: "Установка керамического винира", name_uz: "Keramik vinir o'rnatish", price: "2000000.00" },
            { id: 4, name_ru: "Имплант Straumann (Швейцария)", name_uz: "Straumann implanti (Shveytsariya)", price: "5500000.00" },
            { id: 5, name_ru: "Проф. чистка (две челюсти)", name_uz: "Prof. tozalash (ikkala jag')", price: "400000.00" }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch doctors/services from API:", err);
        setDoctors([
          {
            id: 1,
            first_name: "Фаррух Расулович",
            last_name: "Хужанов",
            specialization: "Ортопед-хирург"
          },
          {
            id: 2,
            first_name: "Бекзод Баймуратович",
            last_name: "Мухтаров",
            specialization: "Имплантолог-хирург"
          },
          {
            id: 3,
            first_name: "Шохрух Расулович",
            last_name: "Хужанов",
            specialization: "Терапевт-ортодонт"
          },
          {
            id: 4,
            first_name: "Мирзоубайдуллохон",
            last_name: "Илёсхонов",
            specialization: "Терапевт-ортодонт"
          }
        ]);
        setServices([
          { id: 1, name_ru: "Консультация врача", name_uz: "Shifokor maslahati", price: "50000.00" },
          { id: 2, name_ru: "Лечение кариеса (1 зуб)", name_uz: "Kariesni davolash (1 ta tish)", price: "350000.00" },
          { id: 3, name_ru: "Установка керамического винира", name_uz: "Keramik vinir o'rnatish", price: "2000000.00" },
          { id: 4, name_ru: "Имплант Straumann (Швейцария)", name_uz: "Straumann implanti (Shveytsariya)", price: "5500000.00" },
          { id: 5, name_ru: "Проф. чистка (две челюсти)", name_uz: "Prof. tozalash (ikkala jag')", price: "400000.00" }
        ]);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (doctorId && bookingDate) {
      setSlotsLoading(true);
      axios.get(`${API_URL}/api/appointments/appointments/available-slots/?doctor_id=${doctorId}&date=${bookingDate}`)
        .then(res => {
          setAvailableSlots(res.data);
          // if previously selected time is no longer available, clear it
          if (bookingTime && !res.data.includes(bookingTime)) {
            setBookingTime('');
          }
        })
        .catch(err => console.error(err))
        .finally(() => setSlotsLoading(false));
    } else {
      setAvailableSlots([]);
      if (!bookingDate) setBookingTime('');
    }
  }, [doctorId, bookingDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!firstName || !lastName || !phone || !birthDate || !doctorId || !bookingDate || !bookingTime) {
      setError(language === 'ru' ? 'Пожалуйста, заполните все обязательные поля.' : 'Iltimos, barcha majburiy maydonlarni to\'ldiring.');
      setLoading(false);
      return;
    }

    try {
      // Combine date and time to ISO datetime
      const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 45 * 60 * 1000); // default 45 mins duration

      let formattedBirthDate = birthDate;
      if (birthDate.includes('.')) {
        const parts = birthDate.split('.');
        if (parts.length === 3) {
          formattedBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const payload = {
        patient_first_name: firstName,
        patient_last_name: lastName,
        patient_phone: phone,
        patient_birth_date: formattedBirthDate,
        doctor: parseInt(doctorId),
        service: serviceId ? parseInt(serviceId) : null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: notes
      };

      const res = await axios.post(`${API_URL}/api/appointments/appointments/`, payload);
      setSuccess(true);
      setSuccessPatientId(res.data.patient);
      
      // Clear form
      setFirstName('');
      setLastName('');
      setPhone('+998');
      setBirthDate('');
      setDoctorId('');
      setServiceId('');
      setBookingDate('');
      setBookingTime('');
      setNotes('');
    } catch (err: any) {
      console.error(err);
      setError(t.booking.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="book" className="py-24 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 flex flex-col lg:flex-row">
          
          {/* Left Column: Contact info */}
          <div className="lg:w-5/12 p-12 lg:p-16 bg-blue-600 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background design */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl -ml-20 -mb-20" />

            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-6 tracking-tight">
                {language === 'ru' ? 'Контакты клиники' : 'Aloqa ma\'lumotlari'}
              </h2>
              <p className="text-blue-100/90 mb-10 text-base leading-relaxed">
                {language === 'ru' 
                  ? 'Свяжитесь с нами любым удобным способом или заполните форму записи на прием. Мы ответим вам в течение 15 минут.' 
                  : 'Sizga qulay usulda biz bilan bog\'laning yoki qabul shaklini to\'ldiring. 15 daqiqa ichida javob beramiz.'}
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-widest font-bold mb-1">{language === 'ru' ? 'Телефон' : 'Telefon'}</p>
                    <a href="tel:+998999822292" className="text-lg font-bold hover:underline">+998 (99) 982-22-92</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-widest font-bold mb-1">{language === 'ru' ? 'Адрес' : 'Manzil'}</p>
                    <p className="text-base font-semibold">{language === 'ru' ? 'г. Ташкент, ул. Амира Темура, 45' : 'Toshkent sh., Amir Temur ko\'chasi, 45-uy'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-widest font-bold mb-1">Email</p>
                    <a href="mailto:info@prodent.uz" className="text-base font-semibold hover:underline">info@prodent.uz</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4">
              <a 
                href="tel:+998999822292"
                className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-slate-50 transition-all"
              >
                <Phone className="h-4 w-4" />
                {language === 'ru' ? 'Позвонить' : 'Qo\'ng\'iroq'}
              </a>
              <a 
                href="https://t.me/prodent_stomatologiya" 
                target="_blank"
                className="flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-bold border border-blue-400 hover:bg-blue-400 transition-all"
              >
                <Send className="h-4 w-4" />
                Telegram
              </a>
            </div>
          </div>

          {/* Right Column: Dynamic Form */}
          <div className="lg:w-7/12 p-12 lg:p-16 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2">{t.booking.title}</h3>
              <p className="text-slate-500 mb-8 text-sm">{t.booking.subtitle}</p>

              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-green-50 border border-green-200 text-green-800 flex flex-col gap-4 mb-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">{t.booking.success_title}</p>
                      <p className="text-sm text-green-700">{t.booking.success_desc}</p>
                    </div>
                  </div>

                  {successPatientId && (
                    <div className="mt-2 p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-blue-800">Получать напоминания о приёмах в Telegram?</p>
                        <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Бот пришлет вам напоминание за час до приёма.</p>
                      </div>
                      <a
                        href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'prodent_stomatologiya_bot'}?start=patient_${successPatientId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm animate-pulse"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Подключить напоминания</span>
                      </a>
                    </div>
                  )}
                </motion.div>
              ) : null}

              {error ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 mb-6">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              ) : null}

              {!success && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.booking.name} *</label>
                      <input 
                        type="text" 
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm" 
                        placeholder={language === 'ru' ? 'Имя' : 'Ism'} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{language === 'ru' ? 'Фамилия' : 'Familiya'} *</label>
                      <input 
                        type="text" 
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm" 
                        placeholder={language === 'ru' ? 'Фамилия' : 'Familiya'} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.booking.phone} *</label>
                      <input 
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm font-semibold"
                        placeholder="+998 99 982-22-92"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {language === 'ru' ? 'Дата рождения *' : 'Tug\'ilgan sana *'}
                      </label>
                      <input 
                        type="text"
                        required
                        value={birthDate}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d]/g, '');
                          if (val.length > 2) val = val.slice(0, 2) + '.' + val.slice(2);
                          if (val.length > 5) val = val.slice(0, 5) + '.' + val.slice(5, 9);
                          setBirthDate(val);
                        }}
                        placeholder="ДД.ММ.ГГГГ"
                        maxLength={10}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.booking.doctor} *</label>
                      <select 
                        required
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm"
                      >
                        <option value="">{t.booking.select_doctor}</option>
                        {doctors.map(doc => (
                          <option key={doc.id} value={doc.id}>
                            {doc.last_name} {doc.first_name} ({doc.specialization})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.booking.service}</label>
                      <select 
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm"
                      >
                        <option value="">{t.booking.select_service}</option>
                        {services.map(serv => (
                          <option key={serv.id} value={serv.id}>
                            {language === 'ru' ? serv.name_ru : serv.name_uz}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.booking.date} *</label>
                      <input 
                        type="date" 
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm font-semibold" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.booking.time} *</label>
                      
                      {!doctorId || !bookingDate ? (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-500 text-center">
                          {language === 'ru' ? 'Выберите врача и дату, чтобы увидеть доступное время' : 'Mavjud vaqtni ko\'rish uchun shifokor va sanani tanlang'}
                        </div>
                      ) : slotsLoading ? (
                        <div className="p-4 text-center text-sm text-slate-400">
                          {language === 'ru' ? 'Загрузка слотов...' : 'Vaqtlar yuklanmoqda...'}
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-600 text-center font-semibold">
                          {language === 'ru' ? 'На эту дату нет свободных слотов' : 'Ushbu sanada bo\'sh vaqtlar yo\'q'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                          {availableSlots.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingTime(slot)}
                              className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                                bookingTime === slot 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.booking.notes}</label>
                    <textarea 
                      rows={3} 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm" 
                      placeholder={language === 'ru' ? 'Опишите ваши симптомы или пожелания...' : 'Muammoni yoki istaklaringizni yozing...'}
                    ></textarea>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-13 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2">
                    {loading ? (language === 'ru' ? 'Отправка...' : 'Yuborilmoqda...') : t.booking.submit}
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>

            {/* Embedded Google Maps Widget */}
            <div className="mt-8 h-48 w-full bg-slate-100 rounded-2xl overflow-hidden shadow-inner relative border border-slate-100">
              <iframe 
                src="https://maps.google.com/maps?q=41.372667,69.266944&z=16&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
