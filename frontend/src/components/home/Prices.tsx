"use client";

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { DollarSign, Tag, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

interface Service {
  id: number;
  name_ru: string;
  name_uz: string;
  price: string;
  duration_minutes: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const Prices = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/appointments/services/`);
        setServices(res.data);
      } catch (err) {
        console.error("Failed to fetch services from API:", err);
        // Fallback seed data
        setServices([
          { id: 1, name_ru: "Консультация врача", name_uz: "Shifokor maslahati", price: "50000.00", duration_minutes: 20 },
          { id: 2, name_ru: "Лечение кариеса (1 зуб)", name_uz: "Kariesni davolash (1 ta tish)", price: "350000.00", duration_minutes: 45 },
          { id: 3, name_ru: "Установка керамического винира", name_uz: "Keramik vinir o'rnatish", price: "2000000.00", duration_minutes: 60 },
          { id: 4, name_ru: "Имплант Straumann (Швейцария)", name_uz: "Straumann implanti (Shveytsariya)", price: "5500000.00", duration_minutes: 90 },
          { id: 5, name_ru: "Проф. чистка (две челюсти)", name_uz: "Prof. tozalash (ikkala jag')", price: "400000.00", duration_minutes: 30 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const formatPrice = (priceStr: string) => {
    const num = parseFloat(priceStr);
    return num.toLocaleString();
  };

  return (
    <section id="prices" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              {t.prices.title}
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              {t.prices.subtitle}
            </p>
          </motion.div>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
            <span className="font-extrabold text-lg">{t.prices.service}</span>
            <span className="font-extrabold text-lg">{t.prices.price}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {services.map((item) => (
              <div key={item.id} className="px-8 py-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 text-base">
                    {language === 'ru' ? item.name_ru : item.name_uz}
                  </p>
                  <p className="text-xs text-slate-400 font-semibold">
                    ⏱ {item.duration_minutes} {language === 'ru' ? 'минут' : 'daqiqa'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-blue-600">
                    {formatPrice(item.price)} {t.prices.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            {language === 'ru' 
              ? '* Окончательная стоимость лечения определяется врачом после осмотра и проведения рентген-диагностики.' 
              : '* Yakuniy davolash narxi shifokor ko\'rigi va rentgen diagnostikasidan so\'ng aniqlanadi.'}
          </p>
        </div>

      </div>
    </section>
  );
};
