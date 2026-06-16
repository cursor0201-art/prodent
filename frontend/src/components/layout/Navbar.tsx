"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, Phone, UserCheck, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'uz' : 'ru');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight text-blue-600">
              SHARK<span className="text-slate-800">DENTA</span>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="#services" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              {t.nav.services}
            </Link>
            <Link href="#about" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              {t.nav.about}
            </Link>
            <Link href="#prices" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              {t.nav.prices}
            </Link>
            <Link href="#contacts" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              {t.nav.contacts}
            </Link>
            <Link href="#faq" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              {t.nav.faq}
            </Link>
            
            <button 
              onClick={toggleLanguage}
              className="text-xs font-bold px-3 py-1.5 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-slate-700"
            >
              {language === 'ru' ? 'RU / UZ' : 'UZ / RU'}
            </button>

            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1.5 border-slate-200 hover:bg-slate-50">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span>{t.nav.crm}</span>
              </Button>
            </Link>

            <Link href="#book">
              <Button className="rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all font-semibold px-5">
                {t.nav.book}
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="text-xs font-bold px-2.5 py-1 border border-slate-200 rounded-full text-slate-700"
            >
              {language.toUpperCase()}
            </button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-slate-700">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-3 shadow-lg absolute top-20 left-0 w-full animate-in fade-in slide-in-from-top-5 duration-200">
          <Link 
            href="#services" 
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          >
            {t.nav.services}
          </Link>
          <Link 
            href="#about" 
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          >
            {t.nav.about}
          </Link>
          <Link 
            href="#prices" 
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          >
            {t.nav.prices}
          </Link>
          <Link 
            href="#contacts" 
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          >
            {t.nav.contacts}
          </Link>
          <Link 
            href="#faq" 
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          >
            {t.nav.faq}
          </Link>
          
          <div className="pt-4 flex flex-col gap-2">
            <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="outline" className="w-full rounded-full flex items-center justify-center gap-1.5 border-slate-200">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span>{t.nav.crm}</span>
              </Button>
            </Link>
            <Link href="#book" onClick={() => setIsOpen(false)} className="w-full">
              <Button className="w-full rounded-full bg-blue-600 text-white">
                {t.nav.book}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
