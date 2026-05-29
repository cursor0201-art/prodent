"use client";

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { Calendar, User, UserCheck } from 'lucide-react';
import axios from 'axios';
import Image from 'next/image';

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  bio: string;
  avatar: string | null;
  working_hours: Record<string, string[]> | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prodent-htae.onrender.com';

export const Doctors = () => {
  const { t, language } = useLanguage();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/doctors/`);
        setDoctors(res.data);
      } catch (err) {
        console.error("Failed to fetch doctors from API:", err);
        // Fallback static seed if backend is offline or loading
        setDoctors([
          {
            id: 1,
            first_name: "Азиз",
            last_name: "Азизов",
            specialization: "Стоматолог-терапевт",
            bio: "Специалист высшей категории с опытом работы более 12 лет. Специализируется на эндодонтии и лечении зубов под микроскопом.",
            avatar: null,
            working_hours: { "Пн-Пт": ["09:00", "18:00"] }
          },
          {
            id: 2,
            first_name: "Сардор",
            last_name: "Саидов",
            specialization: "Стоматолог-ортопед",
            bio: "Эксперт в области эстетического протезирования, установки ультраниров и коронковых протезов любой сложности.",
            avatar: null,
            working_hours: { "Вт-Чт, Сб": ["09:00", "18:00"] }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <section id="doctors" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              {t.doctors.title}
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              {t.doctors.subtitle}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {doctors.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row gap-8 items-start hover:shadow-lg transition-all"
            >
              {/* Doctor Avatar */}
              <div className="w-32 h-32 rounded-2xl bg-blue-100 border border-blue-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-blue-600">
                {doc.avatar ? (
                  <Image 
                    src={doc.avatar.startsWith('http') ? doc.avatar : `${API_URL}${doc.avatar}`} 
                    alt={`${doc.last_name}`} 
                    className="object-cover w-full h-full" 
                    width={128}
                    height={128}
                  />
                ) : (
                  <User className="h-16 w-16 opacity-40" />
                )}
              </div>

              {/* Doctor Bio and Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md">
                    {doc.specialization}
                  </span>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">
                    {doc.last_name} {doc.first_name}
                  </h3>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed">
                  {doc.bio}
                </p>

                {doc.working_hours && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>
                      {language === 'ru' ? 'График работы:' : 'Ish grafigi:'}{' '}
                      {Object.entries(doc.working_hours).map(([days, hours]) => (
                        <span key={days} className="text-slate-700">
                          {days} ({hours.join(' - ')})
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <a href="#book" className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-bold hover:underline">
                    <UserCheck className="h-4 w-4" />
                    <span>{language === 'ru' ? 'Записаться к врачу' : 'Shifokorga yozilish'}</span>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
