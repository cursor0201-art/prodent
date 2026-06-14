"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  Activity, 
  Upload, 
  Heart, 
  TrendingDown, 
  Check, 
  AlertCircle,
  FileCheck,
  Coins,
  Smile,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

interface DentalRecord {
  id: number;
  tooth_number: number;
  condition: string;
  notes: string;
  updated_at: string;
}

interface PatientFile {
  id: number;
  file: string;
  file_type: 'XRAY' | 'PHOTO' | 'OTHER';
  description: string;
  uploaded_at: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  patronymic: string;
  phone: string;
  birth_date: string;
  gender: 'MALE' | 'FEMALE';
  address: string;
  allergy_info: string;
  balance: string;
  dental_records?: DentalRecord[];
  files?: PatientFile[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prodent-hfae.onrender.com';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Registration Form Modal
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [phone, setPhone] = useState('+998');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [address, setAddress] = useState('');
  const [allergyInfo, setAllergyInfo] = useState('');
  
  // Tooth Update Modal
  const [isToothModalOpen, setIsToothModalOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [toothCondition, setToothCondition] = useState('Здоров');
  const [toothNotes, setToothNotes] = useState('');
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'XRAY' | 'PHOTO' | 'OTHER'>('XRAY');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await axios.get(`${API_URL}/api/patients/patients/`, { headers });
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetail = async (patientId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await axios.get(`${API_URL}/api/patients/patients/${patientId}/`, { headers });
      setSelectedPatient(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError('');
    setStatusMessage('');

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    let formattedBirthDate = birthDate;
    if (birthDate.includes('.')) {
      const parts = birthDate.split('.');
      if (parts.length === 3) {
        formattedBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      patronymic: patronymic,
      phone: phone,
      birth_date: formattedBirthDate,
      gender: gender,
      address: address,
      allergy_info: allergyInfo,
      balance: "0.00"
    };

    try {
      await axios.post(`${API_URL}/api/patients/patients/`, payload, { headers });
      setStatusMessage('Пациент успешно зарегистрирован!');
      setIsRegModalOpen(false);
      fetchPatients();
      
      // Clear form
      setFirstName('');
      setLastName('');
      setPatronymic('');
      setPhone('+998');
      setBirthDate('');
      setAddress('');
      setAllergyInfo('');
    } catch (err) {
      console.error(err);
      setStatusError('Ошибка регистрации. Проверьте правильность полей.');
    }
  };

  const handleToothClick = (toothNum: number) => {
    const record = selectedPatient?.dental_records?.find(r => r.tooth_number === toothNum);
    setSelectedTooth(toothNum);
    setToothCondition(record ? record.condition : 'Здоров');
    setToothNotes(record ? record.notes : '');
    setIsToothModalOpen(true);
  };

  const handleSaveToothRecord = async () => {
    if (!selectedPatient || selectedTooth === null) return;
    
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    const payload = {
      patient: selectedPatient.id,
      tooth_number: selectedTooth,
      condition: toothCondition,
      notes: toothNotes
    };

    try {
      await axios.post(`${API_URL}/api/patients/dental-records/`, payload, { headers });
      setIsToothModalOpen(false);
      loadPatientDetail(selectedPatient.id);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении данных зуба.');
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0 || !selectedPatient) return;
    
    setUploadLoading(true);
    const token = localStorage.getItem('access_token');
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    };

    try {
      // Upload files concurrently
      await Promise.all(acceptedFiles.map(file => {
        const formData = new FormData();
        formData.append('patient', selectedPatient.id.toString());
        formData.append('file', file);
        formData.append('file_type', uploadType);
        formData.append('description', uploadDesc || file.name);
        return axios.post(`${API_URL}/api/patients/files/`, formData, { headers });
      }));
      setUploadDesc('');
      loadPatientDetail(selectedPatient.id);
    } catch (err) {
      console.error(err);
      alert('Не удалось загрузить файлы.');
    } finally {
      setUploadLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Filter patients on search
  const filteredPatients = patients.filter(p => 
    `${p.last_name} ${p.first_name} ${p.phone}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dental ISO formula arrays
  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const getToothColor = (toothNum: number) => {
    const record = selectedPatient?.dental_records?.find(r => r.tooth_number === toothNum);
    if (!record) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    
    switch (record.condition) {
      case 'Здоров': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Кариес': return 'bg-yellow-50 text-yellow-600 border-yellow-300';
      case 'Пульпит': return 'bg-red-50 text-red-600 border-red-200';
      case 'Пломбирован': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Коронка': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Отсутствует': return 'bg-slate-100 text-slate-400 border-slate-200';
      case 'Имплант': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    }
  };

  const getToothConditionLabel = (toothNum: number) => {
    const record = selectedPatient?.dental_records?.find(r => r.tooth_number === toothNum);
    return record ? record.condition : 'Здоров';
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8">
      {/* Left panel: Patients list */}
      <div className="w-1/3 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-slate-800 text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>База пациентов</span>
            </h2>
            <Button 
              onClick={() => setIsRegModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить</span>
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Поиск по ФИО, телефону..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-slate-700 text-sm font-semibold transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
            {loading ? (
              <div className="text-center text-slate-400 text-xs py-8">Загрузка базы...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">Никого не найдено.</div>
            ) : (
              filteredPatients.map(p => (
                <div
                  key={p.id}
                  onClick={() => loadPatientDetail(p.id)}
                  className={cn(
                    "p-4 rounded-2xl border border-slate-100 cursor-pointer transition-all hover:bg-slate-50 flex justify-between items-center",
                    selectedPatient?.id === p.id ? "bg-blue-50/50 border-blue-200" : "bg-white"
                  )}
                >
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{p.last_name} {p.first_name}</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">{p.phone}</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold",
                    parseFloat(p.balance) < 0 ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  )}>
                    {parseFloat(p.balance).toLocaleString()} сум
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right panel: Active patient details */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-6 overflow-y-auto shadow-sm">
        {selectedPatient ? (
          <div className="space-y-8">
            
            {/* Header / Meta card */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md">
                  Карточка пациента #{selectedPatient.id}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-800">
                  {selectedPatient.last_name} {selectedPatient.first_name} {selectedPatient.patronymic}
                </h2>
                <div className="flex gap-4 text-xs font-semibold text-slate-500">
                  <p>📞 {selectedPatient.phone}</p>
                  <p>🎂 {new Date(selectedPatient.birth_date).toLocaleDateString()}</p>
                  <p>📍 {selectedPatient.address || 'Адрес не указан'}</p>
                </div>
              </div>
              
              <div className="text-right space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Баланс пациента</p>
                <p className={cn(
                  "text-xl font-black",
                  parseFloat(selectedPatient.balance) < 0 ? "text-red-500" : "text-green-600"
                )}>
                  {parseFloat(selectedPatient.balance).toLocaleString()} сум
                </p>
              </div>
            </div>

            {/* Health warnings / Allergies */}
            {selectedPatient.allergy_info && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-0.5">Особые отметки / Аллергии</p>
                  <p className="text-sm font-semibold">{selectedPatient.allergy_info}</p>
                </div>
              </div>
            )}

            {/* ISO Tooth Chart */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                <Smile className="h-5 w-5 text-blue-500" />
                <span>Интерактивная зубная формула (ISO)</span>
              </h3>
              
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/40 flex flex-col gap-6 items-center">
                {/* Upper Teeth Row */}
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {upperTeeth.map(num => (
                    <button
                      key={num}
                      onClick={() => handleToothClick(num)}
                      className={cn(
                        "w-10 h-14 rounded-lg border-2 flex flex-col items-center justify-between py-1.5 font-extrabold text-xs shadow-sm hover:scale-105 transition-all",
                        getToothColor(num)
                      )}
                      title={`Зуб ${num}: ${getToothConditionLabel(num)}`}
                    >
                      <span className="text-[9px] text-slate-400 font-bold">{num}</span>
                      <span className="text-[10px]">{num % 10}</span>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-slate-200 w-full" />

                {/* Lower Teeth Row */}
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {lowerTeeth.map(num => (
                    <button
                      key={num}
                      onClick={() => handleToothClick(num)}
                      className={cn(
                        "w-10 h-14 rounded-lg border-2 flex flex-col items-center justify-between py-1.5 font-extrabold text-xs shadow-sm hover:scale-105 transition-all",
                        getToothColor(num)
                      )}
                      title={`Зуб ${num}: ${getToothConditionLabel(num)}`}
                    >
                      <span className="text-[10px]">{num % 10}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{num}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tooth Color Legends */}
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-emerald-500 rounded border border-emerald-400" />
                  <span>Здоров</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-yellow-400 rounded border border-yellow-300" />
                  <span>Кариес</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-red-500 rounded border border-red-400" />
                  <span>Пульпит</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-blue-500 rounded border border-blue-400" />
                  <span>Пломба</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-purple-500 rounded border border-purple-400" />
                  <span>Коронка</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-cyan-500 rounded border border-cyan-400" />
                  <span>Имплант</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-slate-200 rounded border border-slate-300" />
                  <span>Отсутствует</span>
                </div>
              </div>
            </div>

            {/* X-Rays and Files uploads */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                <FileCheck className="h-5 w-5 text-blue-500" />
                <span>Медицинские файлы / Рентген-снимки</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* File Upload card */}
                <div className="p-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="flex gap-2">
                      <select
                        value={uploadType}
                        onChange={(e: any) => setUploadType(e.target.value)}
                        className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold outline-none bg-white"
                      >
                        <option value="XRAY">Рентген-снимок (X-RAY)</option>
                        <option value="PHOTO">Фото зуба (PHOTO)</option>
                        <option value="OTHER">Другое (OTHER)</option>
                      </select>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Название или описание файла..." 
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white outline-none"
                    />
                  </div>

                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "mt-4 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                      isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className={cn("h-8 w-8 mb-2", isDragActive ? "text-blue-500" : "text-slate-400")} />
                    {uploadLoading ? (
                      <p className="text-xs font-bold text-slate-500">Загрузка...</p>
                    ) : isDragActive ? (
                      <p className="text-xs font-bold text-blue-500">Бросайте файлы сюда!</p>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-600">Перетащите файлы сюда</p>
                        <p className="text-[10px] text-slate-400 mt-1">или кликните для выбора</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Files List */}
                <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {selectedPatient.files && selectedPatient.files.length > 0 ? (
                    selectedPatient.files.map(f => (
                      <div key={f.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{f.description}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{f.file_type}</p>
                        </div>
                        <a 
                          href={f.file.startsWith('http') ? f.file : `${API_URL}${f.file}`} 
                          target="_blank" 
                          className="text-[10px] font-black text-blue-600 hover:underline"
                        >
                          Открыть
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-slate-400 text-xs font-semibold">Файлы отсутствуют.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
            <Users className="h-16 w-16 opacity-30" />
            <p className="font-semibold text-sm">Выберите пациента из списка слева для просмотра карты, истории лечения и рентген-снимков.</p>
          </div>
        )}
      </div>

      {/* Patient Registration Modal */}
      <AnimatePresence>
        {isRegModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span>Регистрация нового пациента</span>
                </h3>
                <button onClick={() => setIsRegModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterPatient} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Имя *</label>
                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Фамилия *</label>
                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Отчество</label>
                  <input type="text" value={patronymic} onChange={(e) => setPatronymic(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Телефон *</label>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Дата рождения *</label>
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
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Пол</label>
                  <select value={gender} onChange={(e: any) => setGender(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold">
                    <option value="MALE">Мужской</option>
                    <option value="FEMALE">Женский</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Адрес</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Информация об аллергиях</label>
                  <input type="text" value={allergyInfo} onChange={(e) => setAllergyInfo(e.target.value)} placeholder="Например: Аллергия на лидокаин, пенициллин..." className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none" />
                </div>

                <Button type="submit" className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold shadow-md shadow-blue-100 mt-4">
                  Зарегистрировать пациента
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tooth Record Modal */}
      <AnimatePresence>
        {isToothModalOpen && selectedTooth !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <Smile className="h-4 w-4 text-blue-400" />
                  <span>Состояние зуба #{selectedTooth}</span>
                </h3>
                <button onClick={() => setIsToothModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Статус зуба</label>
                  <select
                    value={toothCondition}
                    onChange={(e) => setToothCondition(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold"
                  >
                    <option value="Здоров">Здоров</option>
                    <option value="Кариес">Кариес</option>
                    <option value="Пульпит">Пульпит</option>
                    <option value="Пломбирован">Пломбирован</option>
                    <option value="Коронка">Коронка</option>
                    <option value="Отсутствует">Отсутствует</option>
                    <option value="Имплант">Имплант</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Заметки / Лечение</label>
                  <textarea
                    rows={3}
                    value={toothNotes}
                    onChange={(e) => setToothNotes(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-sm outline-none"
                    placeholder="Описание лечения, материалы..."
                  />
                </div>

                <Button 
                  onClick={handleSaveToothRecord}
                  className="w-full h-11 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold shadow-md shadow-blue-100"
                >
                  Сохранить
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
