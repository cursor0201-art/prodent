"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  History, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert,
  FileCheck,
  CheckCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface Material {
  id: number;
  sku: string;
  name: string;
  category: 'ANESTHESIA' | 'FILLINGS' | 'IMPLANTS' | 'TOOLS' | 'OTHER';
  quantity: string;
  unit: string;
  min_threshold: string;
  price_per_unit: string;
}

interface MaterialLog {
  id: number;
  material: number;
  material_detail: {
    sku: string;
    name: string;
    unit: string;
  };
  quantity_changed: string;
  log_type: 'REFILL' | 'CONSUMPTION';
  notes: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prodent-htae.onrender.com';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddMatOpen, setIsAddMatOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  // New Material Form Fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'ANESTHESIA' | 'FILLINGS' | 'IMPLANTS' | 'TOOLS' | 'OTHER'>('OTHER');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('шт');
  const [minThreshold, setMinThreshold] = useState('5.00');
  const [pricePerUnit, setPricePerUnit] = useState('');

  // Write-off / Refill Form Fields
  const [selectedMatId, setSelectedMatId] = useState('');
  const [logType, setLogType] = useState<'REFILL' | 'CONSUMPTION'>('CONSUMPTION');
  const [changeQty, setChangeQty] = useState('');
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [matRes, logRes] = await Promise.all([
        axios.get(`${API_URL}/api/inventory/materials/`, { headers }),
        axios.get(`${API_URL}/api/inventory/logs/`, { headers })
      ]);
      setMaterials(matRes.data);
      setLogs(logRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || !quantity || !pricePerUnit) return alert('Пожалуйста, заполните обязательные поля.');

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    const payload = {
      sku,
      name,
      category,
      quantity: parseFloat(quantity),
      unit,
      min_threshold: parseFloat(minThreshold),
      price_per_unit: parseFloat(pricePerUnit)
    };

    try {
      await axios.post(`${API_URL}/api/inventory/materials/`, payload, { headers });
      setIsAddMatOpen(false);
      
      // Clear Form
      setSku('');
      setName('');
      setCategory('OTHER');
      setQuantity('');
      setUnit('шт');
      setMinThreshold('5.00');
      setPricePerUnit('');

      fetchInventoryData();
    } catch (err) {
      console.error(err);
      alert('Не удалось добавить материал. Возможно, SKU уже существует.');
    }
  };

  const handleRecordLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatId || !changeQty) return alert('Выберите материал и количество.');

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    // Consumption logs must send NEGATIVE value to adjust stock down on hook!
    const parsedQty = parseFloat(changeQty);
    const finalQty = logType === 'CONSUMPTION' ? -Math.abs(parsedQty) : Math.abs(parsedQty);

    const payload = {
      material: parseInt(selectedMatId),
      quantity_changed: finalQty,
      notes: logNotes || (logType === 'CONSUMPTION' ? 'Списание на лечение' : 'Пополнение запасов')
    };

    try {
      await axios.post(`${API_URL}/api/inventory/logs/`, payload, { headers });
      setIsLogOpen(false);
      
      // Clear Form
      setSelectedMatId('');
      setChangeQty('');
      setLogNotes('');

      fetchInventoryData();
    } catch (err) {
      console.error(err);
      alert('Ошибка при списании/пополнении.');
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'ANESTHESIA': return 'Анестезия';
      case 'FILLINGS': return 'Пломбировочные материалы';
      case 'IMPLANTS': return 'Импланты';
      case 'TOOLS': return 'Инструменты';
      default: return 'Прочее';
    }
  };

  const isLowStock = (mat: Material) => {
    return parseFloat(mat.quantity) <= parseFloat(mat.min_threshold);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Управление складом материалов</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Отслеживайте остатки инструментов и препаратов, регистрируйте списания на процедуры.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsLogOpen(true)}
            variant="outline"
            className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-11 px-4 font-bold flex items-center gap-1.5"
          >
            <History className="h-5 w-5" />
            <span>Списать / Пополнить</span>
          </Button>
          
          <Button 
            onClick={() => setIsAddMatOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-5 font-bold shadow-md shadow-blue-100 flex items-center gap-1.5"
          >
            <Plus className="h-5 w-5" />
            <span>Новый материал</span>
          </Button>
        </div>
      </div>

      {/* Grid of contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Materials List Table - Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main materials inventory card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-extrabold text-slate-800 text-lg">Каталог материалов на складе</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs">Загрузка каталога...</div>
            ) : materials.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs">На складе пусто.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">SKU / Категория</th>
                      <th className="px-6 py-4">Название</th>
                      <th className="px-6 py-4 text-center">Остаток</th>
                      <th className="px-6 py-4 text-center">Порог оповещения</th>
                      <th className="px-6 py-4 text-right">Цена за ед.</th>
                      <th className="px-6 py-4 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materials.map((mat) => {
                      const low = isLowStock(mat);
                      return (
                        <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-xs text-slate-800">{mat.sku}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{getCategoryLabel(mat.category)}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {mat.name}
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-center text-slate-800">
                            {parseFloat(mat.quantity).toFixed(0)} {mat.unit}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-center text-slate-400">
                            {parseFloat(mat.min_threshold).toFixed(0)} {mat.unit}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-right text-slate-600">
                            {parseFloat(mat.price_per_unit).toLocaleString()} сум
                          </td>
                          <td className="px-6 py-4 text-center">
                            {low ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold">
                                <AlertTriangle className="h-3 w-3" />
                                Мало
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 text-[9px] font-bold">
                                Норма
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Warehouse action log - Right Column */}
        <div className="space-y-8">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-1.5">
                <History className="h-5 w-5 text-blue-600" />
                <span>Журнал операций</span>
              </h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Хронология списаний и приходов.</p>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-100">
              {logs.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-8">История пуста.</div>
              ) : (
                logs.slice(0, 8).map((log) => {
                  const isNeg = parseFloat(log.quantity_changed) < 0;
                  return (
                    <div key={log.id} className="pt-3.5 flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">{log.material_detail?.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{new Date(log.created_at).toLocaleDateString('ru-RU')} • {log.notes}</p>
                      </div>
                      <div className={cn(
                        "text-xs font-black flex items-center gap-0.5",
                        isNeg ? "text-red-500" : "text-green-600"
                      )}>
                        {isNeg ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        {Math.abs(parseFloat(log.quantity_changed))} {log.material_detail?.unit}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Refill / Consume Material Modal */}
      <AnimatePresence>
        {isLogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-blue-400" />
                  <span>Списание / Пополнение</span>
                </h3>
                <button onClick={() => setIsLogOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRecordLog} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Действие</label>
                  <select
                    value={logType}
                    onChange={(e: any) => setLogType(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold"
                  >
                    <option value="CONSUMPTION">Расход / Списание зубоврачебное</option>
                    <option value="REFILL">Приход / Пополнение склада</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Материал</label>
                  <select
                    required
                    value={selectedMatId}
                    onChange={(e) => setSelectedMatId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none text-slate-800"
                  >
                    <option value="">Выберите товар</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({parseFloat(m.quantity).toFixed(0)} {m.unit} осталось)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Количество</label>
                  <input
                    type="number"
                    required
                    value={changeQty}
                    onChange={(e) => setChangeQty(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold text-slate-800"
                    placeholder="Введите количество"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Примечание / Назначение</label>
                  <input
                    type="text"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none"
                    placeholder="Например: Списание для пациента Алишера"
                  />
                </div>

                <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 mt-2">
                  Зафиксировать операцию
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Material Modal */}
      <AnimatePresence>
        {isAddMatOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-400" />
                  <span>Добавление нового материала</span>
                </h3>
                <button onClick={() => setIsAddMatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMaterial} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SKU *</label>
                    <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} placeholder="EXP: FILL-101" className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ед. измерения</label>
                    <input type="text" required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="шт / амп / г" className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Название материала *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Filtek композит световой" className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Категория</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold"
                  >
                    <option value="ANESTHESIA">Анестезия</option>
                    <option value="FILLINGS">Пломбировочные материалы</option>
                    <option value="IMPLANTS">Импланты</option>
                    <option value="TOOLS">Инструменты</option>
                    <option value="OTHER">Прочее</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Количество *</label>
                    <input type="number" required value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="10" className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Порог оповещения</label>
                    <input type="number" required value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} placeholder="5" className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Цена за единицу (сум) *</label>
                  <input type="number" required value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} placeholder="15000" className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm outline-none font-bold" />
                </div>

                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 mt-4">
                  Добавить на склад
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
