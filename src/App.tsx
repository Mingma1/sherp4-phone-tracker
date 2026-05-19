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
  Key,
  Database
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
  const [activeTab, setActiveTab] = useState<'inventory' | 'stats' | 'history' | 'settings'>('inventory');
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
      <div className="h-6 bg-black" />

      <header className="px-4 sm:px-6 pt-6 pb-4 sticky top-0 bg-black/80 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 font-display">
                SHERP4
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md tracking-widest uppercase">
                  Solo Level • S-Rank
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  localStorage.removeItem('APP_UNLOCKED');
                  setIsUnlocked(false);
                }}
                className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all cursor-pointer"
                title="Lock Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 h-10 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer font-black text-black text-xs uppercase tracking-wider font-display"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          <div className="mt-4 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search IMEI or Model..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="px-3 sm:px-4 pb-28 max-w-5xl mx-auto">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
        {activeTab === 'settings' && (
          <div className="mt-8 space-y-8 max-w-xl mx-auto">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white/60 px-2">System Configuration</h2>
            
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Gemini OCR Key</h3>
                  <p className="text-xs text-white/40">Used for background 3uTools report extraction</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-white/40">Current Key</label>
                <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5 font-mono text-xs text-white/60">
                  <span>{apiKey.slice(0, 6)}••••••••••••••••••••••••••••{apiKey.slice(-4)}</span>
                  <button 
                    onClick={() => {
                      if (confirm('Remove key and re-authenticate?')) {
                        localStorage.removeItem('GEMINI_API_KEY');
                        setApiKey('');
                      }
                    }}
                    className="text-[10px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Inventory Backup</h3>
                  <p className="text-xs text-white/40">Download a complete snapshot of all stock and expenses</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  const backup = {
                    timestamp: new Date().toISOString(),
                    phones,
                    expenses
                  };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sherp4_backup_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-4 bg-white/10 hover:bg-white/15 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10"
              >
                Download JSON Backup
              </button>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[2.5rem] space-y-4 text-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-400">Security & Access</h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                Locking the session will require entering your master pass code (<code className="text-white/60">Sherpa2026</code>) to regain access.
              </p>
              <button 
                onClick={() => {
                  localStorage.removeItem('APP_UNLOCKED');
                  setIsUnlocked(false);
                }}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer border border-red-500/30 inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Lock Application Now
              </button>
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

      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 px-6 pt-3 pb-6 z-[60]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavButton 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')}
            icon={<Package className="w-5 h-5" />}
            label="Stock"
          />
          <NavButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')}
            icon={<TrendingUp className="w-5 h-5" />}
            label="Stats"
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            icon={<History className="w-5 h-5" />}
            label="History"
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="w-5 h-5" />}
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={onClick}
      className="group relative bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden active:scale-[0.97] transition-transform flex flex-row cursor-pointer hover:bg-white/[0.07] hover:border-white/15"
    >
      {/* Compact image thumbnail */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden bg-white/5">
        {phone.imageUrl ? (
          <img 
            src={phone.imageUrl} 
            alt={phone.model}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Smartphone className="w-7 h-7 text-white/[0.08]" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md backdrop-blur-md ${
            phone.status === 'In Stock' ? 'bg-emerald-500 text-black' : 
            phone.status === 'Sold' ? 'bg-white/20 text-white' :
            'bg-amber-500/80 text-black'
          }`}>
            {phone.status}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-xs sm:text-sm leading-tight truncate">{phone.model}</h3>
            {phone.storageCapacity && (
              <span className="text-[8px] font-black bg-white/10 px-1.5 py-0.5 rounded leading-none shrink-0">
                {phone.storageCapacity}
              </span>
            )}
          </div>
          <p className="text-[9px] font-mono text-white/25 mt-0.5 uppercase tracking-tight truncate">
            {phone.imei.slice(-8)} • {phone.color || '—'}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="font-mono text-emerald-400 font-black text-sm">रु {phone.buyPrice.toLocaleString()}</p>
          <span className="text-[9px] font-mono text-white/40 font-bold">
            {phone.batteryHealth ? `${phone.batteryHealth}%` : ''}
          </span>
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
