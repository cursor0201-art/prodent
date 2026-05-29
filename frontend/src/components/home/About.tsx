"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { ShieldCheck, Heart, Award } from 'lucide-react';

export const About = () => {
  const { t, language } = useLanguage();

  return (
    <section id="about" className="py-24 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Image Grid Column */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 relative w-full"
          >
            <div className="relative rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-white">
              <img 
                src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1000" 
                alt="Doctor working" 
                className="object-cover w-full h-[400px]"
              />
            </div>
            
            <div className="absolute -top-6 -right-6 bg-blue-600 text-white py-6 px-8 rounded-2xl shadow-xl flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold">10+</span>
              <span className="text-xs uppercase tracking-wider font-bold">{t.hero.stat_years}</span>
            </div>
          </motion.div>

          {/* Text Content Column */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                {t.about.badge}
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
                {t.about.title}
              </h2>
              
              <div className="space-y-4 text-slate-600 text-base leading-relaxed">
                <p>{t.about.text1}</p>
                <p>{t.about.text2}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <Award className="h-8 w-8 text-blue-600 mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">{language === 'ru' ? 'Лицензия Минздрава' : 'Sog\'liqni saqlash litsenziyasi'}</h4>
                </div>
                
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <Heart className="h-8 w-8 text-red-500 mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">{language === 'ru' ? 'Забота о детях' : 'Bolalar uchun g\'amxo\'rlik'}</h4>
                </div>
                
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <ShieldCheck className="h-8 w-8 text-green-600 mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">{language === 'ru' ? '100% Стерильность' : '100% Sterillik'}</h4>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
