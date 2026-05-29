"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope, 
  FileText,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface Appointment {
  id: number;
  patient: number;
  patient_detail: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
  };
  doctor: number;
  doctor_detail: {
    id: number;
    first_name: string;
    last_name: string;
    specialization: string;
  };
  service: number | null;
  service_detail: {
    id: number;
    name_ru: string;
    name_uz: string;
    price: string;
  } | null;
  start_time: string;
  end_time: string;
  status: 'BOOKED' | 'ARRIVED' | 'COMPLETED' | 'CANCELED';
  notes: string;
}

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

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Form Fields State
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'BOOKED' | 'ARRIVED' | 'COMPLETED' | 'CANCELED'>('BOOKED');
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Week helper
  const getDaysOfWeek = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const daysOfWeek = getDaysOfWeek(currentDate);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const startDateStr = daysOfWeek[0].toISOString().split('T')[0];
    const endDateStr = daysOfWeek[6].toISOString().split('T')[0];

    try {
      const [appRes, docRes, servRes, patRes] = await Promise.all([
        axios.get(`${API_URL}/api/appointments/appointments/?start_date=${startDateStr}&end_date=${endDateStr}`, { headers }),
        axios.get(`${API_URL}/api/users/doctors/`),
        axios.get(`${API_URL}/api/appointments/services/`),
        axios.get(`${API_URL}/api/patients/patients/`, { headers })
      ]);
      setAppointments(appRes.data);
      setDoctors(docRes.data);
      setServices(servRes.data);
      setPatients(patRes.data);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
  };



  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const openNewModal = (dateStr?: string) => {
    setSelectedAppointment(null);
    setPatientId('');
    setDoctorId(doctors[0]?.id.toString() || '');
    setServiceId('');
    setBookingDate(dateStr || new Date().toISOString().split('T')[0]);
    setBookingTime('09:00');
    setNotes('');
    setStatus('BOOKED');
    setFormError('');
    setFormSuccess(false);
    setIsModalOpen(true);
  };

  const openEditModal = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setPatientId(appt.patient.toString());
    setDoctorId(appt.doctor.toString());
    setServiceId(appt.service ? appt.service.toString() : '');
    
    const d = new Date(appt.start_time);
    setBookingDate(d.toISOString().split('T')[0]);
    setBookingTime(d.toTimeString().split(' ')[0].slice(0, 5));
    
    setNotes(appt.notes || '');
    setStatus(appt.status);
    setFormError('');
    setFormSuccess(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!patientId || !doctorId || !bookingDate || !bookingTime) {
      setFormError('Пожалуйста, выберите пациента, врача, дату и время.');
      return;
    }

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 45 * 60 * 1000); // 45 mins

    const payload = {
      patient: parseInt(patientId),
      doctor: parseInt(doctorId),
      service: serviceId ? parseInt(serviceId) : null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: status,
      notes: notes
    };

    try {
      if (selectedAppointment) {
        // Edit Mode
        await axios.put(`${API_URL}/api/appointments/appointments/${selectedAppointment.id}/`, payload, { headers });
      } else {
        // Create Mode
        await axios.post(`${API_URL}/api/appointments/appointments/`, payload, { headers });
      }
      setFormSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        fetchData();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setFormError('Произошла ошибка при сохранении приёма.');
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.delete(`${API_URL}/api/appointments/appointments/${selectedAppointment.id}/`, { headers });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError('Не удалось удалить запись.');
    }
  };

  const getAppointmentsForDay = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    return appointments.filter(a => a.start_time.startsWith(dayStr));
  };

  const getStatusBadge = (apptStatus: string) => {
    switch (apptStatus) {
      case 'BOOKED': return 'bg-blue-500 text-white';
      case 'ARRIVED': return 'bg-green-500 text-white';
      case 'COMPLETED': return 'bg-slate-400 text-white';
      case 'CANCELED': return 'bg-red-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getDayName = (day: Date) => {
    return day.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Интерактивный календарь</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Просматривайте и управляйте графиком приемов врачей клиники.</p>
        </div>
        <Button 
          onClick={() => openNewModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 h-11 px-5"
        >
          <Plus className="h-5 w-5" />
          <span>Новый прием</span>
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={prevWeek} className="border border-slate-200">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextWeek} className="border border-slate-200">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <h3 className="font-extrabold text-slate-700 text-base ml-2">
            {daysOfWeek[0].toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="border-slate-200 font-bold text-xs text-slate-600 rounded-lg">
            Сегодня
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold">Загрузка календаря...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {daysOfWeek.map((day, i) => {
            const dayAppts = getAppointmentsForDay(day);
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div 
                key={i} 
                className={cn(
                  "bg-white rounded-2xl border min-h-[450px] flex flex-col shadow-sm overflow-hidden",
                  isToday ? "border-blue-500 shadow-md ring-2 ring-blue-100" : "border-slate-200"
                )}
              >
                {/* Day Header */}
                <div className={cn(
                  "p-4 border-b text-center font-bold text-sm flex justify-between items-center",
                  isToday ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700"
                )}>
                  <span>{getDayName(day)}</span>
                  <button 
                    onClick={() => openNewModal(day.toISOString().split('T')[0])}
                    className={cn(
                      "p-1 rounded-md hover:bg-slate-200/50 transition-colors",
                      isToday ? "hover:bg-blue-700 text-white" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Day Slots */}
                <div className="p-3 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[400px]">
                  {dayAppts.length === 0 ? (
                    <div className="text-[11px] text-slate-400 font-semibold text-center mt-6">
                      Нет записей
                    </div>
                  ) : (
                    dayAppts.sort((a,b) => a.start_time.localeCompare(b.start_time)).map((appt) => (
                      <div
                        key={appt.id}
                        onClick={() => openEditModal(appt)}
                        className={cn(
                          "p-3 rounded-xl border border-slate-100 cursor-pointer transition-all hover:scale-[1.02] shadow-sm bg-slate-50/70 hover:bg-slate-50",
                          appt.status === 'CANCELED' && "opacity-50 line-through"
                        )}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-slate-500">
                            {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={cn("h-2 w-2 rounded-full", getStatusBadge(appt.status))} />
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {appt.patient_detail?.last_name} {appt.patient_detail?.first_name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                          Д-р {appt.doctor_detail?.last_name}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-400" />
                  <span>{selectedAppointment ? 'Редактировать запись' : 'Новая запись на прием'}</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {formSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2 text-xs font-bold">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Успешно сохранено!</span>
                  </div>
                )}

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-xs font-bold">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Patient Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    <span>Пациент *</span>
                  </label>
                  <select
                    required
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none text-sm text-slate-800"
                  >
                    <option value="">Выберите пациента</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.last_name} {p.first_name} ({p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    <span>Врач *</span>
                  </label>
                  <select
                    required
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none text-sm text-slate-800"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.last_name} {d.first_name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
                    <span>Услуга</span>
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none text-sm text-slate-800"
                  >
                    <option value="">Выберите услугу (по желанию)</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name_ru} ({parseFloat(s.price).toLocaleString()} сум)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                      <span>Дата *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none text-sm text-slate-800 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      <span>Время *</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none text-sm text-slate-800 font-bold"
                    />
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Статус приёма</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none text-sm text-slate-800 font-bold"
                  >
                    <option value="BOOKED">Записан</option>
                    <option value="ARRIVED">Пришел</option>
                    <option value="COMPLETED">Завершен</option>
                    <option value="CANCELED">Отменен</option>
                  </select>
                </div>

                {/* Clinical Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    <span>Заметки / Жалобы</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm text-slate-800"
                    placeholder="Жалобы пациента, история, анестезия и т.д."
                  />
                </div>

                {/* Buttons Grid */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  {selectedAppointment && (
                    <Button 
                      type="button"
                      onClick={handleDelete}
                      variant="outline" 
                      className="border-red-200 hover:bg-red-50 text-red-600 rounded-xl px-5 h-11 text-xs font-bold"
                    >
                      Удалить
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-xl h-11 text-xs font-bold shadow-md shadow-blue-100"
                  >
                    Сохранить изменения
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
