/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  TrendingUp,
  History,
  Settings,
  Package,
  ArrowUpRight,
  LogOut,
  Lock,
  Database,
  Percent,
  BarChart3
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'react-hot-toast';
import type { Phone, InventoryStats, Expense } from './types';
import AddPhoneModal from './components/AddPhoneModal';
import PhoneDetailModal from './components/PhoneDetailModal';
import SakuraPetals from './components/SakuraPetals';
import PhoneCard from './components/PhoneCard';
import NavButton from './components/NavButton';
import ProfitChart from './components/ProfitChart';
import ConfirmModal from './components/ConfirmModal';
import { useAuth } from './hooks/useAuth';
import { useFirebaseData } from './hooks/useFirebaseData';
import { 
  db, 
  collection, 
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  signIn,
  signOut
} from './services/firebase';

console.log('App initialization started...');

export default function App() {
  const { currentUser, loading: authLoading } = useAuth();
  const { phones, expenses, loading: dataLoading } = useFirebaseData(currentUser);
  
  const loading = authLoading || dataLoading;

  const [activeTab, setActiveTab] = useState<'inventory' | 'stats' | 'history' | 'settings'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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

  const expensesByPhoneId = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    expenses.forEach(e => {
      if (e && e.phoneId) {
        if (!map[e.phoneId]) map[e.phoneId] = [];
        map[e.phoneId].push(e);
      }
    });
    return map;
  }, [expenses]);

  const stats = useMemo(() => {
    let totalProfit = 0;
    let totalInStock = 0;
    let capitalInvested = 0;
    let soldCount = 0;
    let totalInvestmentAll = 0; // For profit margin

    phones.forEach((p) => {
      if (!p) return;
      const isActiveStock = p.status === 'In Stock' || p.status === 'Personal Use' || p.status === 'On Sale';
      const phoneExpenses = (expensesByPhoneId[p.id] || []).reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const investment = (p.buyPrice || 0) + phoneExpenses;
      totalInvestmentAll += investment;

      if (p.status === 'Sold') {
        soldCount++;
        totalProfit += ((p.sellPrice || 0) - (p.buyPrice || 0) - phoneExpenses);
      }
      
      if (isActiveStock) {
        totalInStock++;
        capitalInvested += investment;
      }
    });

    const profitMargin = totalInvestmentAll > 0 ? (totalProfit / totalInvestmentAll) * 100 : 0;

    return {
      totalProfit,
      totalInStock,
      capitalInvested,
      soldCount,
      profitMargin
    } as InventoryStats;
  }, [phones, expensesByPhoneId]);

  const filteredPhones = useMemo(() => {
    return phones.filter(p => {
      const modelMatch = p.model ? p.model.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const imeiMatch = p.imei ? p.imei.includes(searchQuery) : false;
      const matchesSearch = modelMatch || imeiMatch;
      if (filterStatus === 'All') return matchesSearch;
      if (filterStatus === 'In Stock') return matchesSearch && (p.status === 'In Stock' || p.status === 'Personal Use' || p.status === 'On Sale');
      return matchesSearch && p.status === filterStatus;
    });
  }, [phones, searchQuery, filterStatus]);

  // 2. Strict Google Cloud Authentication Screen
  if (!authLoading && !currentUser) {
    return (
      <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden">
        <SakuraPetals count={16} />
        <div className="relative z-10 flex flex-col items-center">
          <Lock className="w-12 h-12 text-white/20 mb-6" />
          <h2 className="text-2xl font-black mb-2 tracking-tighter">Private Cloud Inventory</h2>
          <p className="text-white/40 text-sm mb-12 max-w-[280px] leading-relaxed">
            Access is restricted to verified Google Cloud accounts only.
          </p>

        <button 
          onClick={async () => {
            try {
              await signIn();
            } catch (err: unknown) {
              console.error('Google Sign In Error:', err);
              if (err instanceof Error) {
                toast.error(`Authentication failed: ${err.message}. Please check your popup blocker or network.`);
              } else {
                toast.error('Authentication failed. Please check your browser popup blocker settings.');
              }
            }
          }}
          className="w-full max-w-[300px] py-4 bg-white/10 hover:bg-white/15 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-3 border border-white/10 shadow-xl"
        >
          <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Sign In with Google</span>
        </button>

        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        <SakuraPetals count={25} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black opacity-60" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border border-red-900/30 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-red-600 rounded-full animate-spin" />
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-serif text-white/90 tracking-widest">SHERP4</h2>
            <p className="text-red-500/70 font-bold tracking-[0.3em] text-[10px] uppercase">Initializing System</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Visuals */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>
      
      <Toaster position="top-center" toastOptions={{ 
        style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }
      }} />
      <div className="fixed inset-0 pointer-events-none z-0">
        <SakuraPetals count={15} />
      </div>

      <div className="h-6 relative z-10" />

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
                onClick={async () => {
                  await signOut();
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
              id="searchQuery"
              name="searchQuery"
              type="text"
              placeholder="Search IMEI or Model..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-2">
            {['All', 'In Stock', 'Sold'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  filterStatus === status
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10 px-3 sm:px-4 pb-28 max-w-5xl mx-auto">
        {activeTab === 'inventory' && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base font-bold uppercase tracking-wider text-white/60 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-500" />
                Active Stock
              </h2>
              <span className="text-sm font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                {stats.totalInStock} Items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredPhones
                  .filter(p => p.status === 'In Stock' || p.status === 'Personal Use' || p.status === 'On Sale')
                  .map((phone) => (
                    <PhoneCard key={phone.id} phone={phone} expenses={expensesByPhoneId[phone.id] || []} onClick={() => setSelectedPhone(phone)} />
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
                Sale History
              </h2>
              <span className="text-sm font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                {stats.soldCount} Items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredPhones
                  .filter(p => p.status === 'Sold')
                  .map((phone) => (
                    <PhoneCard key={phone.id} phone={phone} expenses={expensesByPhoneId[phone.id] || []} onClick={() => setSelectedPhone(phone)} />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="mt-8 space-y-8">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white/60 px-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Financials
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-2">
                <p className="text-[11px] uppercase text-white/40 font-black tracking-widest">Total Profit</p>
                <div className="flex items-center gap-1 text-emerald-400">
                  <ArrowUpRight className="w-5 h-5" />
                  <p className="text-2xl font-black font-mono tracking-tighter">रु {stats.totalProfit.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-2">
                <p className="text-[11px] uppercase text-white/40 font-black tracking-widest">Profit Margin</p>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Percent className="w-5 h-5" />
                  <p className="text-2xl font-black font-mono tracking-tighter">{stats.profitMargin.toFixed(1)}%</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-2">
                <p className="text-[11px] uppercase text-white/40 font-black tracking-widest">In Stock</p>
                <p className="text-3xl font-black font-mono">{stats.totalInStock}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-2">
                <p className="text-[11px] uppercase text-white/40 font-black tracking-widest">Sold</p>
                <p className="text-3xl font-black font-mono">{stats.soldCount}</p>
              </div>
            </div>

            <div className="bg-emerald-500 p-8 rounded-[3rem] text-black shadow-2xl shadow-emerald-500/20">
              <p className="text-xs uppercase font-black tracking-widest mb-2 opacity-60">Capital Invested</p>
              <p className="text-4xl font-black font-mono tracking-tighter">रु {stats.capitalInvested.toLocaleString()}</p>
            </div>

            <ProfitChart phones={phones} expenses={expenses} />
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="mt-8 space-y-8 max-w-xl mx-auto">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white/60 px-2">System Configuration</h2>
            
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

            <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[2.5rem] space-y-6 text-center">
              <div className="border-b border-red-500/10 pb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 mb-1">Security & Cloud Access</h3>
                <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                  Manage active sessions and authorized Google accounts.
                </p>
              </div>
              
              {currentUser && (
                <div className="flex items-center justify-between bg-black/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-black text-black text-xs">
                      {currentUser.email?.[0].toUpperCase()}
                    </div>
                    <div className="text-left font-sans">
                      <p className="text-xs font-bold text-white">{currentUser.email}</p>
                      <p className="text-[9px] uppercase tracking-wider text-emerald-400 font-black">Authorized Cloud Session</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setLogoutConfirmOpen(true)}
                    className="text-[10px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Cloud Logout
                  </button>
                </div>
              )}

              <div>
                <button 
                  onClick={async () => {
                    await signOut();
                  }}
                  className="w-full py-4 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all cursor-pointer border border-red-500/30 flex items-center justify-center gap-2 shadow-xl"
                >
                  <LogOut className="w-4 h-4" /> Lock Application Screen
                </button>
              </div>
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
        expenses={selectedPhone ? (expensesByPhoneId[selectedPhone.id] || []) : []}
        onClose={() => setSelectedPhone(null)} 
        onUpdate={handleUpdatePhone}
        onDelete={handleDeletePhone}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      <ConfirmModal
        isOpen={logoutConfirmOpen}
        title="Sign Out"
        message="Are you sure you want to sign out from your Cloud Session?"
        confirmText="Sign Out"
        isDestructive={true}
        onConfirm={async () => {
          await signOut();
          setLogoutConfirmOpen(false);
          toast.success('Signed out successfully');
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
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
