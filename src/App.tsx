/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Plus, 
  LogOut,
  Lock,
  Moon,
  Sun,
  Bell,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Phone, InventoryStats, Expense } from './types';
import AddPhoneModal from './components/AddPhoneModal';
import PhoneDetailModal from './components/PhoneDetailModal';
import PhoneList from './components/PhoneList';
import SakuraPetals from './components/SakuraPetals';
import JapaneseBackdrop from './components/JapaneseBackdrop';
import Dashboard from './pages/Dashboard';
import { useNotifications } from './hooks/useNotifications';
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  auth,
  signIn,
  signOut,
  onAuthStateChanged,
  type User
} from './services/firebase';

console.log('App initialization started...');

function NavBar({ currentUser, onLogout, onAddPhone, darkMode, setDarkMode, notifications, onRequestNotification }: any) {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-gray-400';

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SHERP4</h1>
            <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">Tracker</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex gap-6">
            <Link to="/inventory" className={`pb-2 font-medium ${isActive('/inventory')} hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}>
              Inventory
            </Link>
            <Link to="/dashboard" className={`pb-2 font-medium ${isActive('/dashboard')} hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}>
              Dashboard
            </Link>
            <Link to="/expenses" className={`pb-2 font-medium ${isActive('/expenses')} hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}>
              Expenses
            </Link>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Notifications Badge */}
            <button 
              onClick={onRequestNotification}
              className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Enable Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Add Phone Button */}
            <button 
              onClick={onAddPhone}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Phone</span>
            </button>

            {/* Logout Button */}
            <button 
              onClick={onLogout}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function InventoryPage({ phones, expenses, searchQuery, setSearchQuery, onSelectPhone, onAddPhone, ocrLoading }: any) {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search IMEI or Model..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-3 pl-12 pr-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <PhoneList 
        phones={phones}
        onSelectPhone={onSelectPhone}
        searchQuery={searchQuery}
        ocrLoading={ocrLoading}
      />
    </div>
  );
}

function ExpensesPage({ phones, expenses, onAddExpense, onDeleteExpense }: any) {
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const [category, setCategory] = useState<'Repair' | 'Misc'>('Repair');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoneId || !description || !amount) return;

    await onAddExpense({
      phoneId: selectedPhoneId,
      category,
      description,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
    });

    setSelectedPhoneId('');
    setCategory('Repair');
    setDescription('');
    setAmount('');
  };

  const phoneExpenses = selectedPhoneId 
    ? expenses.filter((e: Expense) => e.phoneId === selectedPhoneId)
    : expenses;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Expense Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 h-fit">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Expense</h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <select
                value={selectedPhoneId}
                onChange={(e) => setSelectedPhoneId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Phone</option>
                {phones.map((p: Phone) => (
                  <option key={p.id} value={p.id}>{p.model} ({p.imei})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'Repair' | 'Misc')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Repair">Repair</option>
                <option value="Misc">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Screen repair"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Add Expense
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Expenses</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {phoneExpenses.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No expenses recorded</p>
            ) : (
              phoneExpenses.map((exp: Expense) => (
                <div key={exp.id} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{exp.description}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{exp.category} • {exp.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 dark:text-white">${exp.amount.toFixed(2)}</p>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent({ phones, expenses, currentUser, onLogout, darkMode, setDarkMode }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const { notifications, requestNotificationPermission, dismissNotification } = useNotifications(phones, expenses);

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

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-white dark:bg-gray-900 min-h-screen transition-colors">
        <NavBar 
          currentUser={currentUser}
          onLogout={onLogout}
          onAddPhone={() => setIsAddModalOpen(true)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          notifications={notifications}
          onRequestNotification={requestNotificationPermission}
        />

        {/* Notifications Display */}
        {notifications.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2">
              {notifications.map(notif => (
                <div key={notif.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{notif.message}</p>
                  {notif.dismissible && (
                    <button
                      onClick={() => dismissNotification(notif.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Routes */}
        <Routes>
          <Route path="/inventory" element={<InventoryPage phones={phones} expenses={expenses} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSelectPhone={setSelectedPhone} onAddPhone={() => setIsAddModalOpen(true)} ocrLoading={ocrLoading} />} />
          <Route path="/dashboard" element={<Dashboard phones={phones} expenses={expenses} />} />
          <Route path="/expenses" element={<ExpensesPage phones={phones} expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />} />
          <Route path="/" element={<InventoryPage phones={phones} expenses={expenses} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSelectPhone={setSelectedPhone} onAddPhone={() => setIsAddModalOpen(true)} ocrLoading={ocrLoading} />} />
        </Routes>

        <AnimatePresence>
          {isAddModalOpen && (
            <AddPhoneModal 
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={handleSavePhone}
              setOcrLoading={setOcrLoading}
              ocrLoading={ocrLoading}
            />
          )}
          {selectedPhone && (
            <PhoneDetailModal
              phone={selectedPhone}
              isOpen={!!selectedPhone}
              onClose={() => setSelectedPhone(null)}
              onUpdate={handleUpdatePhone}
              onDelete={handleDeletePhone}
              expenses={expenses.filter((e: Expense) => e.phoneId === selectedPhone.id)}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email);
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    console.log('App useEffect running. currentUser:', currentUser?.email);
    if (!currentUser) {
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
  }, [currentUser]);

  // Authentication screen
  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden">
        <JapaneseBackdrop />
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
                alert(`Authentication failed: ${err.message}. Please check your popup blocker or network.`);
              } else {
                alert('Authentication failed. Please check your browser popup blocker settings.');
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-500 font-black tracking-widest text-xs uppercase animate-pulse">
          Loading Sherp4...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent 
        phones={phones}
        expenses={expenses}
        currentUser={currentUser}
        onLogout={async () => {
          await signOut();
          setCurrentUser(null);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    </Router>
  );
}
