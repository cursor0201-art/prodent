"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Wallet, 
  Package, 
  Settings,
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarItemProps {
  icon: any;
  label: string;
  href: string;
  active: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active }: SidebarItemProps) => (
  <Link 
    href={href}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon className={cn("h-5 w-5", active ? "text-white" : "group-hover:scale-110 transition-transform")} />
    <span className="font-semibold text-sm">{label}</span>
  </Link>
);

import { AxiosInterceptor } from '@/components/AxiosInterceptor';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
    } else if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Администратор';
      case 'DOCTOR': return 'Врач';
      case 'CASHIER': return 'Кассир';
      case 'OPERATOR': return 'Оператор';
      default: return role;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="px-2">
            <Link href="/dashboard" className="text-2xl font-bold tracking-tight text-blue-600">
              PRODENT<span className="text-slate-800">CRM</span>
            </Link>
          </div>

          <nav className="flex flex-col gap-1.5">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Дашборд" 
              href="/dashboard" 
              active={pathname === '/dashboard'} 
            />
            <SidebarItem 
              icon={Calendar} 
              label="Расписание" 
              href="/dashboard/calendar" 
              active={pathname === '/dashboard/calendar'} 
            />
            <SidebarItem 
              icon={Users} 
              label="Пациенты" 
              href="/dashboard/patients" 
              active={pathname.startsWith('/dashboard/patients')} 
            />
            <SidebarItem 
              icon={Wallet} 
              label="Финансы" 
              href="/dashboard/finance" 
              active={pathname.startsWith('/dashboard/finance')} 
            />
            <SidebarItem 
              icon={Package} 
              label="Склад / Материалы" 
              href="/dashboard/inventory" 
              active={pathname.startsWith('/dashboard/inventory')} 
            />
          </nav>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-100">
          {user && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="object-cover w-full h-full rounded-xl" />
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {user.first_name || user.username}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {getRoleDisplay(user.role)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all font-semibold text-sm"
          >
            <LogOut className="h-5 w-5" />
            <span>Выйти из системы</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-xl w-96">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Быстрый поиск пациентов..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center relative">
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            
            <Link href="/dashboard/calendar">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-md shadow-blue-100 flex items-center gap-1.5 px-4 h-11">
                <Plus className="h-4.5 w-4.5" />
                <span>Запись</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AxiosInterceptor>
            {children}
          </AxiosInterceptor>
        </div>
      </main>
    </div>
  );
}
