"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  FileText, 
  Users, 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface Transaction {
  id: number;
  patient: number | null;
  patient_detail: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
  amount: string;
  transaction_type: 'INCOME' | 'EXPENSE';
  payment_method: 'CASH' | 'CARD';
  description: string;
  created_at: string;
}

interface Debt {
  id: number;
  patient: number;
  patient_detail: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
  };
  total_amount: string;
  paid_amount: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  salary: string;
  kpi_percentage: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prodent-htae.onrender.com';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    net_profit: 0
  });

  // Debt Payment Modal
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD');
  
  // Payroll KPI panel state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [payrollReport, setPayrollReport] = useState<any>(null);

  // New Transaction Form State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [txAmount, setTxAmount] = useState('');
  const [txMethod, setTxMethod] = useState<'CASH' | 'CARD'>('CARD');
  const [txDesc, setTxDesc] = useState('');
  const [txPatient, setTxPatient] = useState('');
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [txRes, summaryRes, debtRes, docRes, patRes] = await Promise.all([
        axios.get(`${API_URL}/api/finance/transactions/`, { headers }),
        axios.get(`${API_URL}/api/finance/transactions/summary/`, { headers }),
        axios.get(`${API_URL}/api/finance/debts/`, { headers }),
        axios.get(`${API_URL}/api/users/doctors/`),
        axios.get(`${API_URL}/api/patients/patients/`, { headers })
      ]);
      setTransactions(txRes.data);
      setSummary(summaryRes.data);
      setDebts(debtRes.data);
      setDoctors(docRes.data);
      setPatients(patRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txDesc) return alert('Введите сумму и описание.');

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    const payload = {
      patient: txPatient ? parseInt(txPatient) : null,
      amount: parseFloat(txAmount),
      transaction_type: txType,
      payment_method: txMethod,
      description: txDesc
    };

    try {
      await axios.post(`${API_URL}/api/finance/transactions/`, payload, { headers });
      setIsTxModalOpen(false);
      
      // Clear Form
      setTxAmount('');
      setTxDesc('');
      setTxPatient('');
      
      fetchFinanceData();
    } catch (err) {
      console.error(err);
      alert('Ошибка добавления транзакции.');
    }
  };

  const handlePayDebt = async () => {
    if (!selectedDebt || !paymentAmount) return;
    
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.post(`${API_URL}/api/finance/debts/${selectedDebt.id}/record_payment/`, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod
      }, { headers });
      
      setSelectedDebt(null);
      setPaymentAmount('');
      fetchFinanceData();
    } catch (err) {
      console.error(err);
      alert('Не удалось зафиксировать оплату долга.');
    }
  };

  const handleCalculatePayroll = async () => {
    if (!selectedDoctorId) return;

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.get(`${API_URL}/api/finance/transactions/salary_calculation/?doctor_id=${selectedDoctorId}`, { headers });
      setPayrollReport(res.data);
    } catch (err) {
      console.error(err);
      alert('Не удалось рассчитать комиссию.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-red-50 text-red-700 border border-red-100';
      case 'PARTIAL': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'PAID': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Не оплачен';
      case 'PARTIAL': return 'Частично';
      case 'PAID': return 'Оплачен';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Финансы и расчёты</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Отслеживайте платежи пациентов, ведите кассовый учёт и рассчитывайте KPI врачей.</p>
        </div>
        <Button 
          onClick={() => setIsTxModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-5 font-bold shadow-md shadow-blue-100 flex items-center gap-1.5"
        >
          <Plus className="h-5 w-5" />
          <span>Новый платёж / расход</span>
        </Button>
      </div>

      {/* Aggregate Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-green-50 text-green-600 rounded-xl">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Приход (Общий)</p>
            <p className="text-xl font-extrabold text-slate-800">
              {summary.total_income.toLocaleString()} сум
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-red-50 text-red-600 rounded-xl">
            <TrendingDown className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Расход (Общий)</p>
            <p className="text-xl font-extrabold text-slate-800">
              {summary.total_expense.toLocaleString()} сум
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Чистая прибыль</p>
            <p className="text-xl font-extrabold text-slate-800">
              {summary.net_profit.toLocaleString()} сум
            </p>
          </div>
        </div>
      </div>

      {/* Main Finance Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cash log ledger - Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Transaction Ledger Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-800 text-lg">Кассовая книга (Транзакции)</h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs">Загрузка платежей...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs">Записей нет.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Дата / Время</th>
                      <th className="px-6 py-4">Тип</th>
                      <th className="px-6 py-4">Пациент / Назначение</th>
                      <th className="px-6 py-4">Способ</th>
                      <th className="px-6 py-4 text-right">Сумма</th>
                      <th className="px-6 py-4 text-center">Чек</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                          {new Date(tx.created_at).toLocaleString('ru-RU')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold",
                            tx.transaction_type === 'INCOME' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {tx.transaction_type === 'INCOME' ? 'ПРИХОД' : 'РАСХОД'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {tx.patient_detail ? `${tx.patient_detail.last_name} ${tx.patient_detail.first_name}` : tx.description}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                          {tx.payment_method === 'CASH' ? 'Наличные' : 'Карта'}
                        </td>
                        <td className={cn(
                          "px-6 py-4 text-sm font-black text-right",
                          tx.transaction_type === 'INCOME' ? "text-green-600" : "text-red-500"
                        )}>
                          {parseFloat(tx.amount).toLocaleString()} сум
                        </td>
                        <td className="px-6 py-4 text-center">
                          {tx.transaction_type === 'INCOME' ? (
                            <a 
                              href={`${API_URL}/api/finance/transactions/${tx.id}/receipt/`} 
                              target="_blank"
                              className="inline-flex p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              <Printer className="h-4 w-4" />
                            </a>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Debts Tracking Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-800 text-lg">Задолженности пациентов</h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs">Загрузка задолженностей...</div>
            ) : debts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs">Долгов нет.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Пациент</th>
                      <th className="px-6 py-4 text-right">Сумма долга</th>
                      <th className="px-6 py-4 text-right">Оплачено</th>
                      <th className="px-6 py-4 text-center">Статус</th>
                      <th className="px-6 py-4 text-center">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {debts.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">
                          {d.patient_detail.last_name} {d.patient_detail.first_name}
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-right text-red-500">
                          {parseFloat(d.total_amount).toLocaleString()} сум
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-right text-slate-600">
                          {parseFloat(d.paid_amount).toLocaleString()} сум
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-bold",
                            getStatusBadge(d.status)
                          )}>
                            {getStatusLabel(d.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {d.status !== 'PAID' ? (
                            <Button 
                              onClick={() => setSelectedDebt(d)}
                              size="sm" 
                              variant="outline" 
                              className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-lg px-3"
                            >
                              Внести платёж
                            </Button>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Doctor commission KPI salary calculation panel - Right Column */}
        <div className="space-y-8">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg">Расчёт зарплат и KPI</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Калькулятор процента комиссии врачей от выполненных услуг.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Выберите врача</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none text-sm text-slate-800 font-semibold"
                >
                  <option value="">Выберите врача</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.last_name} {doc.first_name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <Button 
                onClick={handleCalculatePayroll}
                disabled={!selectedDoctorId}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100"
              >
                Рассчитать зарплату
              </Button>
            </div>

            {payrollReport && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/50 space-y-4"
              >
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-2">
                  <span>Статья</span>
                  <span>Сумма</span>
                </div>
                
                <div className="flex justify-between text-sm font-semibold text-slate-700">
                  <span>Оклад врача:</span>
                  <span>{parseFloat(payrollReport.base_salary).toLocaleString()} сум</span>
                </div>

                <div className="flex justify-between text-sm font-semibold text-slate-700">
                  <span>% KPI от приёма:</span>
                  <span>{payrollReport.kpi_percentage}%</span>
                </div>

                <div className="flex justify-between text-sm font-semibold text-slate-700">
                  <span>Обороты с приёмов:</span>
                  <span>{payrollReport.total_rendered_services_value.toLocaleString()} сум</span>
                </div>

                <div className="flex justify-between text-sm font-bold text-blue-600 border-t pt-2">
                  <span>Комиссия (%):</span>
                  <span>{payrollReport.earned_commission.toLocaleString()} сум</span>
                </div>

                <div className="flex justify-between text-base font-black text-slate-800 border-t pt-2">
                  <span>ИТОГО К ВЫПЛАТЕ:</span>
                  <span>{payrollReport.total_payout.toLocaleString()} сум</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

      </div>

      {/* Record Debt Payment Modal */}
      <AnimatePresence>
        {selectedDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-blue-400" />
                  <span>Внесение платежа по долгу</span>
                </h3>
                <button onClick={() => setSelectedDebt(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-bold">Пациент:</p>
                  <p className="text-sm font-bold text-slate-800">{selectedDebt.patient_detail.last_name} {selectedDebt.patient_detail.first_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-bold">Общая задолженность:</p>
                  <p className="text-sm font-black text-red-500">{parseFloat(selectedDebt.total_amount).toLocaleString()} сум</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-bold">Оплачено ранее:</p>
                  <p className="text-sm font-bold text-slate-700">{parseFloat(selectedDebt.paid_amount).toLocaleString()} сум</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Сумма к оплате (сум)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold text-slate-800"
                    placeholder="Введите сумму"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Метод оплаты</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold"
                  >
                    <option value="CARD">Терминал (Карта)</option>
                    <option value="CASH">Наличные</option>
                  </select>
                </div>

                <Button 
                  onClick={handlePayDebt}
                  className="w-full h-11 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold shadow-md shadow-blue-100"
                >
                  Зафиксировать платёж
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Transaction Modal */}
      <AnimatePresence>
        {isTxModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-400" />
                  <span>Регистрация транзакции</span>
                </h3>
                <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRecordTx} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Тип транзакции</label>
                  <select
                    value={txType}
                    onChange={(e: any) => setTxType(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold"
                  >
                    <option value="INCOME">Приход (Оплата от пациента)</option>
                    <option value="EXPENSE">Расход (Закупка/Аренда/Зарплата)</option>
                  </select>
                </div>

                {txType === 'INCOME' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Пациент</label>
                    <select
                      value={txPatient}
                      onChange={(e) => setTxPatient(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none text-slate-800"
                    >
                      <option value="">Выберите пациента (по желанию)</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.last_name} {p.first_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Сумма (сум)</label>
                  <input
                    type="number"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold text-slate-800"
                    placeholder="Сумма транзакции"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Способ платежа</label>
                  <select
                    value={txMethod}
                    onChange={(e: any) => setTxMethod(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold"
                  >
                    <option value="CARD">Безналичный (Карта)</option>
                    <option value="CASH">Наличные</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Описание / Назначение</label>
                  <textarea
                    rows={2}
                    required
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none"
                    placeholder="Например: Оплата коронки E-max / Restock лидокаина..."
                  />
                </div>

                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 mt-4">
                  Зарегистрировать транзакцию
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
