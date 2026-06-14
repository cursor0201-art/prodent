"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ShieldCheck, Star, Users, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';

export const Hero = () => {
  const { t, language } = useLanguage();

  return (
    <section className="relative pt-36 pb-20 overflow-hidden bg-slate-50">
      {/* Background radial gradients for sleek premium SaaS feel */}
      <div className="absolute top-0 left-1/4 -z-10 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 -z-10 w-96 h-96 bg-cyan-100/50 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          {/* Left Text Column */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-6">
                <CheckCircle className="h-4 w-4" />
                {language === 'ru' ? 'Премиальная стоматология в Ташкенте' : 'Toshkentdagi premium stomatologiya'}
              </span>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                {language === 'ru' ? (
                  <>
                    Создаем улыбки,<br />
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">которым доверяют</span>
                  </>
                ) : (
                  <>
                    Ishonchli va go'zal<br />
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">tabassumlar yaratamiz</span>
                  </>
                )}
              </h1>
              
              <p className="text-lg text-slate-600 mb-8 max-w-2xl leading-relaxed">
                {t.hero.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="#book">
                  <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 text-lg font-semibold shadow-lg shadow-blue-200 hover:shadow-xl transition-all w-full sm:w-auto">
                    {t.hero.cta} <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#services">
                  <Button size="lg" variant="outline" className="rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-14 px-8 text-lg font-semibold w-full sm:w-auto">
                    {t.nav.services}
                  </Button>
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap gap-8 justify-center lg:justify-start border-t border-slate-200/60 pt-8">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">10 {language === 'ru' ? 'лет' : 'yil'}</p>
                    <p className="text-xs text-slate-500">{language === 'ru' ? 'Гарантия качества' : 'Sifat kafolati'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">15k+</p>
                    <p className="text-xs text-slate-500">{t.hero.stat_patients}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-yellow-50 rounded-xl text-yellow-600">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">5.0 / 5.0</p>
                    <p className="text-xs text-slate-500">{language === 'ru' ? 'Отзывы Google' : 'Google baholari'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Image/Mockup Column */}
          <motion.div 
            className="flex-1 relative w-full max-w-md lg:max-w-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-white">
              <div className="w-full aspect-[4/3] relative">
                <Image 
                  src="/clinic-exterior.jpg" 
                  alt="Prodent Stomatologiya Clinic Exterior" 
                  className="object-cover w-full h-full"
                  width={1200}
                  height={900}
                  priority
                />
              </div>
            </div>
            
            {/* Elegant glassmorphic floating details */}
            <div className="absolute -bottom-6 -left-6 z-20 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-xl max-w-xs">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5">
                {language === 'ru' ? '📞 Связь напрямую' : '📞 To\'g\'ridan-to\'g\'ri aloqa'}
              </p>
              <a href="tel:+998999822292" className="text-lg font-extrabold text-slate-800 hover:text-blue-600 transition-colors">
                +998 (99) 982-22-92
              </a>
              <div className="mt-2 flex gap-2">
                <a href="https://t.me/Dr_farrukh1" target="_blank" className="text-xs text-blue-500 hover:underline">Telegram</a>
              </div>
            </div>
            
            {/* Decorative background shape */}
            <div className="absolute -top-6 -right-6 -z-10 w-32 h-32 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full opacity-20 blur-xl" />
          </motion.div>
          
        </div>
      </div>
    </section>
  );
};
