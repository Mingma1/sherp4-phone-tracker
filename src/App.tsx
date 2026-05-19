/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Smartphone, 
  TrendingUp, 
  History, 
  Settings,
  Package,
  ArrowUpRight,
  LogOut,
  Lock,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Phone, InventoryStats, Expense } from './types';
import AddPhoneModal from './components/AddPhoneModal';
import PhoneDetailModal from './components/PhoneDetailModal';
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  addDoc,
  updateDoc,
  doc,
  deleteDoc
} from './services/firebase';

// --- YOUR PRIVATE ACCESS CODE ---
const PRIVATE_CODE = 'Sherpa2026';

console.log('App initialization started...');

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [isUnlocked, setIsUnlocked] = useState(localStorage.getItem('APP_UNLOCKED') === 'true');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'stats' | 'history'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    console.log('App useEffect running. isUnlocked:', isUnlocked);
    if (!isUnlocked) {
      setLoading(false);
      return;
    }

    try {
      const phonesQuery = query(collection(db, 'phones'), orderBy('createdAt', 'desc'));
      const unsubscribePhones = onSnapshot(phonesQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Phone[];
        setPhones(data);
        setLoading(false);
      }, (err) => {
        console.error('Firestore phones error:', err);
        setLoading(false);
      });

      const expensesQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));
      const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Expense[];
        setExpenses(data);
      }, (err) => {
        console.error('Firestore expenses error:', err);
      });

      return () => {
        unsubscribePhones();
        unsubscribeExpenses();
      };
    } catch (e) {
      console.error('Error setting up listeners:', e);
      setLoading(false);
    }
  }, [isUnlocked]);

  const handleSavePhone = async (newPhone: Omit<Phone, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'phones'), {
        ...newPhone,
        createdAt: Date.now(),
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error saving phone:', err);
    }
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      await addDoc(collection(db, 'expenses'), expense);
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const handleUpdatePhone = async (id: string, updates: Partial<Phone>) => {
    try {
      await updateDoc(doc(db, 'phones', id), updates);
      setSelectedPhone(null);
    } catch (err) {
      console.error('Error updating phone:', err);
    }
  };

  const handleDeletePhone = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'phones', id));
      setSelectedPhone(null);
    } catch (err) {
      console.error('Error deleting phone:', err);
    }
  };

  // 1. Setup API Key
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white">
        <Key className="w-12 h-12 text-emerald-500 mb-6" />
        <h2 className="text-2xl font-black mb-2">Secure AI Setup</h2>
        <p className="text-white/40 text-sm mb-8">Paste your Gemini API Key to enable OCR scanning.</p>
        <input 
          type="password" 
          placeholder="Paste Key & Press Enter"
          className="w-full max-w-[300px] bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-center text-white focus:border-emerald-500 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value;
              localStorage.setItem('GEMINI_API_KEY', val);
              setApiKey(val);
            }
          }}
        />
        <p className="text-white/20 text-[10px] mt-4 uppercase tracking-widest font-black">Stored locally in your browser</p>
      </div>
    );
  }

  // 2. Private Password Login
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white">
        <Lock className="w-12 h-12 text-white/20 mb-6" />
        <h2 className="text-2xl font-black mb-2 tracking-tighter">Private Inventory</h2>
        <p className="text-white/40 text-sm mb-12 max-w-[250px] leading-relaxed">
          This dashboard is restricted to authorized personnel only. 
        </p>
        <input 
          type="password" 
          placeholder="Enter Access Code"
          className="w-full max-w-[300px] bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-center text-white focus:border-emerald-500 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if ((e.target as HTMLInputElement).value === PRIVATE_CODE) {
                localStorage.setItem('APP_UNLOCKED', 'true');
                setIsUnlocked(true);
              } else {
                alert('Invalid Code');
              }
            }
          }}
        />
        <button 
          onClick={() => {
            localStorage.removeItem('GEMINI_API_KEY');
            setApiKey('');
          }}
          className="mt-12 text-white/20 text-[10px] uppercase font-black tracking-widest hover:text-white/40 transition-colors"
        >
          Reset API Key
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-500 font-black tracking-widest text-xs uppercase animate-pulse">
          Loading Sherp4...
        </div>
      </div>
    );
  }

  const stats: InventoryStats = {
    totalProfit: phones.reduce((acc, p) => {
      if (!p || p.status !== 'Sold') return acc;
      const phoneExpenses = expenses.filter(e => e && e.phoneId === p.id).reduce((sum, e) => sum + (e.amount || 0), 0);
      return acc + ((p.sellPrice || 0) - (p.buyPrice || 0) - phoneExpenses);
    }, 0),
    totalInStock: phones.filter(p => p && p.status === 'In Stock').length,
    capitalInvested: phones.filter(p => p && p.status === 'In Stock').reduce((acc, p) => acc + (p.buyPrice || 0), 0),
    soldCount: phones.filter(p => p && p.status === 'Sold').length
  };

  const filteredPhones = phones.filter(p => 
    p.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.imei.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
      <div className="h-12 bg-black" />

      <header className="px-6 pt-10 pb-6 sticky top-0 bg-black/80 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white">Inventory</h1>
            <p className="text-xs text-white/20 uppercase tracking-[0.2em] font-black mt-1">Sherp4 Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={async () => {
                const oldData = [
                  { model: "iPhone 12 128GB", buyPrice: 16000, sellPrice: 23000, status: "Sold", imei: "OLD-01", buyDate: "2024-01-01" },
                  { model: "iPhone 12 Pro Max", buyPrice: 32350, sellPrice: 28000, status: "Sold", imei: "OLD-02", buyDate: "2024-01-02" },
                  { model: "iPhone 14 128GB", buyPrice: 35500, sellPrice: 45000, status: "Sold", imei: "OLD-03", buyDate: "2024-01-03" },
                  { model: "iPhone XR", buyPrice: 12000, sellPrice: 14000, status: "Sold", imei: "OLD-04", buyDate: "2024-01-04" },
                  { model: "iPhone 13 Pro Max 128GB", buyPrice: 42000, sellPrice: 51000, status: "Sold", imei: "OLD-05", buyDate: "2024-01-05" },
                  { model: "iPhone 11 Pro Max", buyPrice: 11000, sellPrice: 17500, status: "Sold", imei: "OLD-06", buyDate: "2024-01-06" },
                  { model: "iPhone 11", buyPrice: 12000, sellPrice: 17000, status: "Sold", imei: "OLD-07", buyDate: "2024-01-07" },
                  { model: "iPhone 12", buyPrice: 13000, sellPrice: 23000, status: "Sold", imei: "OLD-08", buyDate: "2024-01-08" },
                  { model: "iPhone 13", buyPrice: 20000, sellPrice: 10000, status: "Sold", imei: "OLD-09", buyDate: "2024-01-09" },
                  { model: "iPhone 8 Plus", buyPrice: 6050, sellPrice: 10000, status: "Sold", imei: "OLD-10", buyDate: "2024-01-10" },
                  { model: "iPhone 12 128GB", buyPrice: 19000, sellPrice: 24500, status: "Sold", imei: "OLD-11", buyDate: "2024-01-11" },
                  { model: "PS4 Fat 500GB", buyPrice: 10000, sellPrice: 17000, status: "Sold", imei: "OLD-12", buyDate: "2024-01-12" },
                  { model: "iPhone X", buyPrice: 8500, sellPrice: 12000, status: "Sold", imei: "OLD-13", buyDate: "2024-01-13" },
                  { model: "iPhone 12", buyPrice: 19500, sellPrice: 24000, status: "Sold", imei: "OLD-14", buyDate: "2024-01-14" },
                  { model: "iPhone 12", buyPrice: 19500, sellPrice: 23000, status: "Sold", imei: "OLD-15", buyDate: "2024-01-15" },
                  { model: "iPhone 12", buyPrice: 20000, sellPrice: 26000, status: "Sold", imei: "OLD-16", buyDate: "2024-01-16" },
                  { model: "iPhone 14 Pro Max", buyPrice: 60500, status: "Personal Use", imei: "OLD-17", buyDate: "2024-01-17" },
                  { model: "iPhone 12 64GB", buyPrice: 25500, status: "On Sale", imei: "OLD-18", buyDate: "2024-01-18" }
                ];
                if (confirm(`Import ${oldData.length} records?`)) {
                  for (const phone of oldData) {
                    await addDoc(collection(db, 'phones'), { ...phone, createdAt: Date.now() });
                  }
                  alert('Import Complete');
                }
              }}
              className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
            >
              Import
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('APP_UNLOCKED');
                setIsUnlocked(false);
              }}
              className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/40 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-14 h-14 bg-emerald-500 rounded-3xl shadow-2xl shadow-emerald-500/40 active:scale-90 transition-transform flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-8 h-8 text-black" />
            </button>
          </div>
        </div>

        <div className="mt-8 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search IMEI or Model..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-base font-medium focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="px-4 pb-36">
        {activeTab === 'inventory' && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base font-bold uppercase tracking-wider text-white/60 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-500" />
                Active Stock
              </h2>
              <span className="text-sm font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                {phones.filter(p => p.status === 'In Stock').length} Items
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredPhones
                  .filter(p => p.status === 'In Stock')
                  .map((phone) => (
                    <PhoneCard key={phone.id} phone={phone} onClick={() => setSelectedPhone(phone)} />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base font-bold uppercase tracking-wider text-white/60 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Sold History
              </h2>
              <span className="text-sm font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                {phones.filter(p => p.status === 'Sold').length} Items
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredPhones
                  .filter(p => p.status === 'Sold')
                  .map((phone) => (
                    <PhoneCard key={phone.id} phone={phone} onClick={() => setSelectedPhone(phone)} />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="mt-8 space-y-8">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white/60 px-2">Financials</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-2">
                <p className="text-[11px] uppercase text-white/40 font-black tracking-widest">Total Profit</p>
                <div className="flex items-center gap-1 text-emerald-400">
                  <ArrowUpRight className="w-5 h-5" />
                  <p className="text-2xl font-black font-mono tracking-tighter">रु {stats.totalProfit.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-2">
                <p className="text-[11px] uppercase text-white/40 font-black tracking-widest">In Stock</p>
                <p className="text-3xl font-black font-mono">{stats.totalInStock}</p>
              </div>
            </div>

            <div className="bg-emerald-500 p-8 rounded-[3rem] text-black shadow-2xl shadow-emerald-500/20">
              <p className="text-xs uppercase font-black tracking-widest mb-2 opacity-60">Capital Invested</p>
              <p className="text-4xl font-black font-mono tracking-tighter">रु {stats.capitalInvested.toLocaleString()}</p>
            </div>
          </div>
        )}
      </main>

      <AddPhoneModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleSavePhone} 
      />

      <PhoneDetailModal 
        phone={selectedPhone} 
        expenses={expenses.filter(e => e.phoneId === selectedPhone?.id)}
        onClose={() => setSelectedPhone(null)} 
        onUpdate={handleUpdatePhone}
        onDelete={handleDeletePhone}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 px-6 pt-4 pb-10 z-[60]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavButton 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')}
            icon={<Package className="w-6 h-6" />}
            label="Stock"
          />
          <NavButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')}
            icon={<TrendingUp className="w-6 h-6" />}
            label="Stats"
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            icon={<History className="w-6 h-6" />}
            label="History"
          />
          <NavButton 
            active={false} 
            onClick={() => {}}
            icon={<Settings className="w-6 h-6" />}
            label="Set"
          />
        </div>
      </nav>
    </div>
  );
}

interface PhoneCardProps {
  phone: Phone;
  onClick: () => void;
  key?: string | number;
}

function PhoneCard({ phone, onClick }: PhoneCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className="group relative bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden active:scale-[0.96] transition-transform flex flex-col cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden bg-white/5">
        {phone.imageUrl ? (
          <img 
            src={phone.imageUrl} 
            alt={phone.model}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Smartphone className="w-12 h-12 text-white/5" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1">
          <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-lg backdrop-blur-md ${
            phone.status === 'In Stock' ? 'bg-emerald-500 text-black' : 'bg-white/20 text-white'
          }`}>
            {phone.status}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-sm leading-tight line-clamp-2">{phone.model}</h3>
            {phone.storageCapacity && (
              <span className="text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded leading-none shrink-0 ml-1">
                {phone.storageCapacity}
              </span>
            )}
          </div>
          <p className="text-[9px] font-mono text-white/30 mt-1 uppercase tracking-tighter">
            {phone.imei.slice(-8)} • {phone.color || 'No Col'}
          </p>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-white/40 font-bold uppercase">Battery</span>
            <span className="text-xs font-mono font-black text-white/80">{phone.batteryHealth || '??'}%</span>
          </div>
          <div className="pt-2 border-t border-white/5">
            <p className="font-mono text-emerald-400 font-black text-base">रु {phone.buyPrice.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all relative cursor-pointer ${active ? 'text-emerald-500' : 'text-white/30'}`}
    >
      <div className={`p-1 rounded-xl transition-colors ${active ? 'bg-emerald-500/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute -bottom-2 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"
        />
      )}
    </button>
  );
}
