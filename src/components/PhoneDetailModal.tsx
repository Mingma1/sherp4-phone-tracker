import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  DollarSign, 
  Calendar, 
  MapPin, 
  User, 
  Phone as PhoneIcon,
  CheckCircle2,
  Clock,
  ChevronRight,
  ClipboardList,
  Edit2,
  Wrench,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Phone, Expense } from '../types';

interface PhoneDetailModalProps {
  phone: Phone | null;
  expenses: Expense[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Phone>) => void;
  onDelete: (id: string) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export default function PhoneDetailModal({ 
  phone, 
  expenses, 
  onClose, 
  onUpdate, 
  onDelete,
  onAddExpense,
  onDeleteExpense
}: PhoneDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  
  const [editData, setEditData] = useState<Partial<Phone>>({});
  const [sellData, setSellData] = useState({
    sellPrice: '',
    sellDate: new Date().toISOString().split('T')[0],
    sellLocation: '',
    buyerName: '',
    buyerNumber: ''
  });

  // Sync state when phone changes
  useEffect(() => {
    if (phone) {
      setEditData({ ...phone });
      setSellData({
        sellPrice: phone.sellPrice?.toString() || '',
        sellDate: phone.sellDate || new Date().toISOString().split('T')[0],
        sellLocation: phone.sellLocation || '',
        buyerName: phone.buyerName || '',
        buyerNumber: phone.buyerNumber || ''
      });
    }
  }, [phone]);

  if (!phone) return null;

  const handleUpdate = () => {
    onUpdate(phone.id, editData);
    setIsEditing(false);
  };

  const handleSell = () => {
    if (!sellData.sellPrice || !sellData.buyerName) {
      alert('Please enter Sell Price and Buyer Name');
      return;
    }
    onUpdate(phone.id, {
      ...sellData,
      sellPrice: parseFloat(sellData.sellPrice),
      status: 'Sold'
    });
    setIsSelling(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#080808] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="relative h-64 overflow-hidden">
          {phone.imageUrl ? (
            <img src={phone.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <ClipboardList className="w-16 h-16 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] to-transparent" />
          
          <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white z-10">
            <X className="w-6 h-6" />
          </button>

          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute top-6 left-6 p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-emerald-500 z-10"
            >
              <Edit2 className="w-6 h-6" />
            </button>
          )}

          <div className="absolute bottom-6 left-8 right-8">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                phone.status === 'In Stock' ? 'bg-emerald-500 text-black' : 'bg-white/20 text-white'
              }`}>
                {phone.status}
              </span>
              {phone.storageCapacity && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-white/10 text-white">
                  {phone.storageCapacity}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black tracking-tighter">{phone.model}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-8 scrollbar-hide">
          {isEditing ? (
            <div className="space-y-6 pt-4">
              <h3 className="text-xl font-black uppercase tracking-widest text-emerald-500 mb-6">Edit Device</h3>
              <div className="grid grid-cols-2 gap-4">
                <EditField label="Model" value={editData.model || ''} onChange={v => setEditData(p => ({...p, model: v}))} />
                <EditField label="IMEI" value={editData.imei || ''} onChange={v => setEditData(p => ({...p, imei: v}))} />
                <EditField label="Buy Price" type="number" value={editData.buyPrice?.toString() || ''} onChange={v => setEditData(p => ({...p, buyPrice: parseFloat(v)}))} />
                <EditField label="Storage" value={editData.storageCapacity || ''} onChange={v => setEditData(p => ({...p, storageCapacity: v}))} />
                <EditField label="Color" value={editData.color || ''} onChange={v => setEditData(p => ({...p, color: v}))} />
                <EditField label="Battery %" type="number" value={editData.batteryHealth?.toString() || ''} onChange={v => setEditData(p => ({...p, batteryHealth: parseInt(v)}))} />
              </div>
              <EditField label="Buy Location" value={editData.buyLocation || ''} onChange={v => setEditData(p => ({...p, buyLocation: v}))} />
              <EditField label="Seller Name" value={editData.sellerName || ''} onChange={v => setEditData(p => ({...p, sellerName: v}))} />
              <EditField label="Seller Contact" value={editData.sellerNumber || ''} onChange={v => setEditData(p => ({...p, sellerNumber: v}))} />
              <EditField label="Remarks" value={editData.remarks || ''} onChange={v => setEditData(p => ({...p, remarks: v}))} />
              
              {phone.status === 'Sold' && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">Edit Sale Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <EditField label="Sold Price" type="number" value={editData.sellPrice?.toString() || ''} onChange={v => setEditData(p => ({...p, sellPrice: parseFloat(v)}))} />
                    <EditField label="Sold Date" type="date" value={editData.sellDate || ''} onChange={v => setEditData(p => ({...p, sellDate: v}))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <EditField label="Buyer Name" value={editData.buyerName || ''} onChange={v => setEditData(p => ({...p, buyerName: v}))} />
                    <EditField label="Buyer Number" value={editData.buyerNumber || ''} onChange={v => setEditData(p => ({...p, buyerNumber: v}))} />
                  </div>
                  <EditField label="Sold Location" value={editData.sellLocation || ''} onChange={v => setEditData(p => ({...p, sellLocation: v}))} />
                </div>
              )}
              
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-5 bg-white/5 rounded-3xl font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-white/10 transition-colors">Discard</button>
                <button onClick={handleUpdate} className="flex-[2] py-5 bg-emerald-500 text-black rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 cursor-pointer hover:bg-emerald-400 transition-colors">Save Changes</button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <InfoBox label="IMEI" value={phone.imei} />
                <InfoBox label="Serial" value={phone.serialNumber || 'N/A'} />
                <InfoBox label="Battery" value={`${phone.batteryHealth || '??'}%`} />
                <InfoBox label="Color" value={phone.color || 'N/A'} />
              </div>

              <Section title="Buy Information">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-white/60">Buy Price</p>
                </div>
                <p className="text-xl font-black font-mono text-emerald-400">रु {phone.buyPrice.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DetailItem icon={<Calendar />} label="Date" value={phone.buyDate} />
                <DetailItem icon={<MapPin />} label="Location" value={phone.buyLocation || 'N/A'} />
                <DetailItem icon={<User />} label="Seller" value={phone.sellerName || 'N/A'} />
                <DetailItem icon={<PhoneIcon />} label="Contact" value={phone.sellerNumber || 'N/A'} />
              </div>
            </div>
          </Section>

          {phone.status === 'Sold' ? (
            <Section title="Sell Information">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <DollarSign className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-sm font-bold text-white/60">Sold Price</p>
                  </div>
                  <p className="text-xl font-black font-mono text-blue-400">रु {phone.sellPrice?.toLocaleString()}</p>
                </div>
                
                <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                  <p className="text-[10px] uppercase font-black text-emerald-500 mb-1">Profit</p>
                  <p className="text-lg font-black font-mono text-emerald-400">रु {((phone.sellPrice || 0) - phone.buyPrice).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DetailItem icon={<User />} label="Buyer" value={phone.buyerName || 'N/A'} />
                  <DetailItem icon={<PhoneIcon />} label="Number" value={phone.buyerNumber || 'N/A'} />
                  <DetailItem icon={<Calendar />} label="Sold Date" value={phone.sellDate || 'N/A'} />
                  <DetailItem icon={<MapPin />} label="Location" value={phone.sellLocation || 'N/A'} />
                </div>
              </div>
            </Section>
          ) : isSelling ? (
            <Section title="Mark as Sold">
              <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <EditField label="Sell Price" type="number" value={sellData.sellPrice} onChange={v => setSellData(p => ({...p, sellPrice: v}))} />
                  <EditField label="Sell Date" type="date" value={sellData.sellDate} onChange={v => setSellData(p => ({...p, sellDate: v}))} />
                </div>
                <EditField label="Buyer Name" value={sellData.buyerName} onChange={v => setSellData(p => ({...p, buyerName: v}))} icon={<User className="w-4 h-4" />} />
                <EditField label="Buyer Number" value={sellData.buyerNumber} onChange={v => setSellData(p => ({...p, buyerNumber: v}))} icon={<PhoneIcon className="w-4 h-4" />} />
                <EditField label="Sell Location" value={sellData.sellLocation} onChange={v => setSellData(p => ({...p, sellLocation: v}))} icon={<MapPin className="w-4 h-4" />} />
                
                <div className="flex gap-2 pt-4">
                  <button onClick={() => setIsSelling(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Cancel</button>
                  <button onClick={handleSell} className="flex-[2] py-4 bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Finalize Sale
                  </button>
                </div>
              </div>
            </Section>
          ) : (
            <button 
              onClick={() => setIsSelling(true)}
              className="w-full py-6 bg-emerald-500 text-black rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-500/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mb-8"
            >
              <DollarSign className="w-5 h-5" />
              Identify as Sold
            </button>
          )}

          <Section title="Repair & Expense Log">
            <div className="space-y-4">
              {expenses.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center">
                  <Wrench className="w-8 h-8 text-white/10 mb-2" />
                  <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">No expenses recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${e.category === 'Repair' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-white/40">{e.category}</p>
                          <p className="text-xs font-bold">{e.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black font-mono">रु {e.amount.toLocaleString()}</p>
                        <button onClick={() => onDeleteExpense(e.id)} className="text-[8px] font-black uppercase text-red-500/40 hover:text-red-500 transition-colors">Remove</button>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-emerald-500/60">Total Overhead</p>
                    <p className="text-sm font-black font-mono text-emerald-500">रु {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {!showExpenses ? (
                <button 
                  onClick={() => setShowExpenses(true)}
                  className="w-full py-4 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Add Expense
                </button>
              ) : (
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                       <p className="text-[10px] uppercase text-white/40 font-black tracking-widest ml-1">Category</p>
                       <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-emerald-500 appearance-none"
                        onChange={(e) => setEditData(p => ({...p, tempCat: e.target.value as any}))}
                       >
                         <option value="Repair">Repair</option>
                         <option value="Misc">Misc</option>
                       </select>
                    </div>
                    <EditField label="Amount" type="number" value={editData.tempAmt?.toString() || ''} onChange={v => setEditData(p => ({...p, tempAmt: parseFloat(v)}))} />
                  </div>
                  <EditField label="Description" value={editData.tempDesc || ''} onChange={v => setEditData(p => ({...p, tempDesc: v}))} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowExpenses(false)} className="flex-1 py-3 bg-white/5 rounded-xl font-bold uppercase text-[10px]">Cancel</button>
                    <button 
                      onClick={() => {
                        onAddExpense({
                          phoneId: phone.id,
                          category: (editData as any).tempCat || 'Repair',
                          amount: (editData as any).tempAmt || 0,
                          description: (editData as any).tempDesc || '',
                          date: new Date().toISOString().split('T')[0]
                        });
                        setShowExpenses(false);
                      }}
                      className="flex-1 py-3 bg-emerald-500 text-black rounded-xl font-black uppercase text-[10px]"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {phone.remarks && (
            <Section title="Remarks">
              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                <p className="text-sm font-medium text-white/50 italic leading-relaxed">"{phone.remarks}"</p>
              </div>
            </Section>
          )}
          </>
          )}

          <div className="pt-8 pb-12 flex justify-between items-center px-2">
            <button 
              onClick={() => { if(confirm('Delete this device permanently?')) onDelete(phone.id); }}
              className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            >
              <Trash2 className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-white/20">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Added {new Date(phone.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <div className="w-1 h-3 bg-emerald-500 rounded-full" />
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/20">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
      <p className="text-[10px] uppercase font-black text-white/20 mb-1">{label}</p>
      <p className="text-sm font-bold truncate">{value}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
      <div className="text-white/20">{icon}</div>
      <div>
        <p className="text-[8px] uppercase font-black text-white/20 leading-none mb-1">{label}</p>
        <p className="text-[10px] font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', icon }: { label: string, value: string, onChange: (v: string) => void, type?: string, icon?: React.ReactNode }) {
  return (
    <div className="space-y-2 group">
      <p className="text-[10px] uppercase text-white/40 font-black tracking-widest ml-1">{label}</p>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">{icon}</div>}
        <input 
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 ${icon ? 'pl-11' : 'px-4'} pr-4 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all`}
        />
      </div>
    </div>
  );
}
