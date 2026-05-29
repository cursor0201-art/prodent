"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prodent-htae.onrender.com';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!username || !password) {
      setError('Имя пользователя и пароль обязательны.');
      setLoading(false);
      return;
    }

    try {
      // 1. Get JWT tokens
      const tokenRes = await axios.post(`${API_URL}/api/token/`, {
        username,
        password
      });

      const { access, refresh } = tokenRes.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // 2. Get user profile details
      const userRes = await axios.get(`${API_URL}/api/users/users/me/`, {
        headers: {
          Authorization: `Bearer ${access}`
        }
      });

      localStorage.setItem('user', JSON.stringify(userRes.data));
      
      // Redirect to CRM Dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError('Неверное имя пользователя или пароль.');
      } else {
        setError('Не удалось подключиться к серверу CRM.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" />
          Вернуться на сайт
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-blue-600 tracking-tight mb-2">
            PRODENT<span className="text-slate-800">CRM</span>
          </h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Панель управления клиники</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-xs font-bold leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Логин</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-13 pl-12 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm font-semibold bg-slate-50/50" 
                placeholder="Имя пользователя"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-13 pl-12 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm font-semibold bg-slate-50/50" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-13 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-lg shadow-blue-100 hover:shadow-xl transition-all"
          >
            {loading ? 'Вход в систему...' : 'Войти в CRM'}
          </Button>
        </form>

        <p className="text-center mt-8 text-[11px] text-slate-400 font-bold leading-normal">
          Доступ только для авторизованных сотрудников клиники Prodent Stomatologiya.
        </p>
      </motion.div>
    </div>
  );
}
