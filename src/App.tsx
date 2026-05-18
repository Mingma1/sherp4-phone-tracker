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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, InventoryStats, Expense } from './types.ts';
import AddPhoneModal from './components/AddPhoneModal.tsx';
import PhoneDetailModal from './components/PhoneDetailModal.tsx';
import { 
  auth, 
  db, 
  signIn, 
  signOut,
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  addDoc,
  updateDoc,
  doc,
  deleteDoc
} from './services/firebase.ts';

const AUTHORIZED_EMAIL = 'msherpa621@gmail.com';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'stats' | 'history'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || user.email !== AUTHORIZED_EMAIL) return;

    const phonesQuery = query(collection(db, 'phones'), orderBy('createdAt', 'desc'));
    const unsubscribePhones = onSnapshot(phonesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Phone[];
      setPhones(data);
    });

    const expensesQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(data);
    });

    return () => {
      unsubscribePhones();
      unsubscribeExpenses();
    };
  }, [user]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-emerald-500 font-black tracking-widest text-xs uppercase"
        >
          Loading Sherp4...
        </motion.div>
      </div>
    );
  }

  if (!user || user.email !== AUTHORIZED_EMAIL) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/10">
          <Lock className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tighter">Private Inventory</h1>
        <p className="text-white/40 text-sm mb-12 max-w-[250px] leading-relaxed">
          This dashboard is restricted to authorized personnel only. 
        </p>
        {!user ? (
          <button 
            onClick={signIn}
            className="w-full max-w-[280px] py-5 bg-white text-black rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-white/10 active:scale-95 transition-transform"
          >
            Sign in with Google
          </button>
        ) : (
          <div className="space-y-4 w-full max-w-[280px]">
            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">Access Denied: {user.email}</p>
            <button 
              onClick={signOut}
              className="w-full py-5 bg-white/5 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest border border-white/10"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  const stats: InventoryStats = {
    totalProfit: phones.reduce((acc, p) => {
      if (p.status !== 'Sold') return acc;
      const phoneExpenses = expenses.filter(e => e.phoneId === p.id).reduce((sum, e) => sum + e.amount, 0);
      return acc + ((p.sellPrice || 0) - p.buyPrice - phoneExpenses);
    }, 0),
    totalInStock: phones.filter(p => p.status === 'In Stock').length,
    capitalInvested: phones.filter(p => p.status === 'In Stock').reduce((acc, p) => acc + p.buyPrice, 0),
    soldCount: phones.filter(p => p.status === 'Sold').length
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
              onClick={signOut}
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
