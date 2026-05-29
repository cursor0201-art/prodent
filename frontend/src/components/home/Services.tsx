"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Stethoscope, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  HeartPulse,
  Scissors
} from 'lucide-react';

const serviceItems = [
  {
    id: "therapy",
    icon: Stethoscope,
    color: "bg-blue-50 text-blue-600 border-blue-100"
  },
  {
    id: "implants",
    icon: Activity,
    color: "bg-cyan-50 text-cyan-600 border-cyan-100"
  },
  {
    id: "orthodontics",
    icon: HeartPulse,
    color: "bg-orange-50 text-orange-600 border-orange-100"
  },
  {
    id: "orthopedics",
    icon: Sparkles,
    color: "bg-purple-50 text-purple-600 border-purple-100"
  },
  {
    id: "surgery",
    icon: Scissors,
    color: "bg-red-50 text-red-600 border-red-100"
  },
  {
    id: "hygiene",
    icon: ShieldCheck,
    color: "bg-green-50 text-green-600 border-green-100"
  }
];

export const Services = () => {
  const { t, language } = useLanguage();

  return (
    <section id="services" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              {t.services.title}
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              {t.services.subtitle}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviceItems.map((service, i) => {
            // Retrieve translations dynamically on service ID
            const title = (t.services as any)[service.id];
            const desc = (t.services as any)[`${service.id}_desc`];
            const Icon = service.icon;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)" }}
                className="p-8 rounded-3xl border border-slate-100 bg-white hover:border-blue-100 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-2xl border ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {desc}
                </p>
                
                <div className="mt-6">
                  <a href="#book" className="text-sm text-blue-600 font-bold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    <span>{language === 'ru' ? 'Записаться' : 'Yozilish'}</span>
                    <span>→</span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
