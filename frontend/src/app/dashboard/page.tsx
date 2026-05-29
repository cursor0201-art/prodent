"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
}

const StatCard = ({ title, value, change, icon: Icon, color }: StatCardProps) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-sm font-bold",
        change >= 0 ? "text-green-600" : "text-red-600"
      )}>
        {change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {Math.abs(change)}%
      </div>
    </div>
    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
    <p className="text-2xl font-extrabold text-slate-800">{value}</p>
  </motion.div>
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prodent-hfae.onrender.com';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    patientsToday: 0,
    totalBookings: 0,
    incomeToday: '0 сум',
    occupancy: '0%'
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchDashboardData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      try {
        // 1. Fetch appointments
        const appRes = await axios.get(`${API_URL}/api/appointments/appointments/`, { headers });
        const allAppts = appRes.data;
        
        // Filter today's appointments
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAppts = allAppts.filter((a: any) => a.start_time.startsWith(todayStr));
        setAppointments(todayAppts.slice(0, 5)); // show top 5 for dashboard

        // 2. Fetch financial summary
        const finRes = await axios.get(`${API_URL}/api/finance/transactions/summary/`, { headers });
        const financeData = finRes.data;

        // 3. Fetch patient count
        const patRes = await axios.get(`${API_URL}/api/patients/patients/`, { headers });
        const totalPatientsCount = patRes.data.length || 0;

        // 4. Fetch top services
        const topSrvRes = await axios.get(`${API_URL}/api/appointments/appointments/analytics/top-services/`, { headers });
        setTopServices(topSrvRes.data);

        setStats({
          patientsToday: todayAppts.length,
          totalBookings: allAppts.length,
          incomeToday: `${financeData.total_income.toLocaleString()} UZS`,
          occupancy: todayAppts.length > 0 ? `${Math.min(100, Math.round((todayAppts.length / 12) * 100))}%` : '0%' // Roughly based on 12 slots a day
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'ARRIVED': return 'bg-green-50 text-green-700 border border-green-100';
      case 'CANCELED': return 'bg-red-50 text-red-700 border border-red-100';
      case 'COMPLETED': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'Записан';
      case 'ARRIVED': return 'Пришел';
      case 'CANCELED': return 'Отменен';
      case 'COMPLETED': return 'Завершен';
      default: return status;
    }
  };

  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Добро пожаловать, {user?.first_name || 'Доктор'}! 👋
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Вот текущие показатели работы стоматологии на сегодня.</p>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Записей на сегодня" 
          value={stats.patientsToday} 
          change={15} 
          icon={Users} 
          color="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Всего приемов" 
          value={stats.totalBookings} 
          change={8} 
          icon={CalendarIcon} 
          color="bg-purple-50 text-purple-600" 
        />
        <StatCard 
          title="Общий приход" 
          value={stats.incomeToday} 
          change={12} 
          icon={TrendingUp} 
          color="bg-green-50 text-green-600" 
        />
        <StatCard 
          title="Загрузка клиники" 
          value={stats.occupancy} 
          change={2} 
          icon={Clock} 
          color="bg-orange-50 text-orange-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Appointments List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-extrabold text-slate-800 text-lg">Приемы на сегодня</h2>
              <Link href="/dashboard/calendar" className="text-blue-600 text-xs font-bold hover:underline">
                Открыть расписание
              </Link>
            </div>
            
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-semibold text-sm">Загрузка приемов...</div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-semibold text-sm">
                На сегодня записей нет.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Время</th>
                      <th className="px-6 py-4">Пациент</th>
                      <th className="px-6 py-4">Услуга</th>
                      <th className="px-6 py-4">Врач</th>
                      <th className="px-6 py-4">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-sm text-slate-800">
                          {formatTime(row.start_time)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {row.patient_detail?.last_name} {row.patient_detail?.first_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {row.service_detail ? row.service_detail.name_ru : 'Консультация'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-semibold">
                          Д-р {row.doctor_detail?.last_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-bold",
                            getStatusBadgeClass(row.status)
                          )}>
                            {getStatusLabel(row.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Popular Services Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-slate-800 text-lg mb-6">Спрос на услуги</h2>
            <div className="space-y-6">
              {topServices.length === 0 && !loading && (
                 <div className="text-center text-slate-400 text-xs font-semibold py-8">Пока нет завершенных услуг.</div>
              )}
              {topServices.map((item, i) => {
                const colors = ['bg-blue-600', 'bg-cyan-500', 'bg-purple-600', 'bg-green-600', 'bg-amber-500'];
                const color = colors[i % colors.length];
                // Calculate percentage relative to the first (top) item or total
                const maxCount = topServices[0]?.count || 1;
                const percentage = Math.round((item.count / maxCount) * 100);
                
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-700 truncate max-w-[75%]">{item.name}</span>
                      <span className="text-slate-400">{item.count} раз</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={cn("h-full rounded-full", color)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-8 border-t border-slate-100 pt-6">
            <Link href="/dashboard/patients">
              <Button variant="outline" className="w-full rounded-xl border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50">
                Посмотреть карточки пациентов
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
