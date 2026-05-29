"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export const Reviews = () => {
  const { language } = useLanguage();

  const reviews = [
    {
      name: language === 'ru' ? 'Александра П.' : 'Aleksandra P.',
      role: language === 'ru' ? 'Пациент' : 'Bemor',
      text: language === 'ru' 
        ? 'Лечила каналы у доктора Азизова. Все прошло абсолютно безболезненно, на современном оборудовании с микроскопом. Теперь только сюда!'
        : 'Shifokor Azizovda tish kanallarini davolatdim. Hammasi butunlay og\'riqsiz, mikroskop ostida zamonaviy uskunalarda o\'tdi. Endi faqat shu yerga kelaman!',
      stars: 5
    },
    {
      name: language === 'ru' ? 'Джасур М.' : 'Jasur M.',
      role: language === 'ru' ? 'Пациент' : 'Bemor',
      text: language === 'ru'
        ? 'Установил имплант Osstem. Операция прошла быстро, прижился отлично. Огромная благодарность ортопеду Сардору Саидову за его профессионализм.'
        : 'Osstem implanti o\'rnatdim. Operatsiya tez o\'tdi, juda yaxshi o\'rnashdi. Ortoped Sardor Saidovga professional yondashuvi uchun katta rahmat.',
      stars: 5
    },
    {
      name: language === 'ru' ? 'Феруза К.' : 'Feruza K.',
      role: language === 'ru' ? 'Пациент' : 'Bemor',
      text: language === 'ru'
        ? 'Привела ребенка на чистку зубов. Очень приветливый персонал, ребенок даже не испугался. Получили рекомендации и подарочек. Рекомендую!'
        : 'Farzandimni tish tozalashga olib keldim. Juda samimiy xodimlar, bola umuman qo\'rqmadi. Maslahatlar va kichik sovg\'a oldik. Tavsiya qilaman!',
      stars: 5
    }
  ];

  return (
    <section id="reviews" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              {language === 'ru' ? 'Отзывы наших пациентов' : 'Bemorlarimiz fikrlari'}
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              {language === 'ru' 
                ? 'Реальные истории людей, которые доверили нам свою улыбку' 
                : 'Tabassumini bizga ishonib topshirgan insonlarning haqiqiy hikoyalari'}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm relative hover:shadow-md transition-all"
            >
              <Quote className="h-10 w-10 text-blue-500/10 absolute top-6 right-6" />
              
              <div className="flex gap-1 mb-4 text-yellow-400">
                {[...Array(rev.stars)].map((_, idx) => (
                  <Star key={idx} className="h-5 w-5 fill-current" />
                ))}
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                "{rev.text}"
              </p>

              <div className="border-t border-slate-100 pt-4">
                <p className="font-bold text-slate-800">{rev.name}</p>
                <p className="text-xs text-slate-400 font-semibold">{rev.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
