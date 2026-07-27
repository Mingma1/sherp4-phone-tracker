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
  AlertCircle,
  FileText,
  ExternalLink,
  Zap,
  Cpu,
  ChevronDown,
  ChevronUp,
  Camera,
  UploadCloud,
  Link as LinkIcon
} from 'lucide-react';
import { parse3uDump } from '../services/parse3uDump';
import { storage, ref, uploadBytes, getDownloadURL } from '../services/firebase';
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
  const [isUploading, setIsUploading] = useState(false);
  const [showRawDumpInput, setShowRawDumpInput] = useState(false);
  const [rawDumpText, setRawDumpText] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [editData, setEditData] = useState<Partial<Phone>>({});
  const [sellData, setSellData] = useState({
    sellPrice: '',
    sellDate: new Date().toISOString().split('T')[0],
    sellLocation: '',
    buyerName: '',
    buyerNumber: ''
  });

  // Separate state for expense form — never pollutes editData
  const [expenseForm, setExpenseForm] = useState({
    category: 'Repair' as 'Repair' | 'Misc',
    amount: '',
    description: ''
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
      setExpenseForm({ category: 'Repair', amount: '', description: '' });
    }
  }, [phone]);

  if (!phone) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `inventory/${Date.now()}_phone_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setEditData(prev => ({ ...prev, imageUrl: downloadURL }));
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleParseRawDumpEdit = () => {
    if (!rawDumpText.trim()) return;
    const res = parse3uDump(rawDumpText);
    setEditData(prev => ({
      ...prev,
      model: res.model || prev.model,
      imei: res.imei || prev.imei,
      serialNumber: res.serialNumber || prev.serialNumber,
      batteryHealth: res.batteryHealth || prev.batteryHealth,
      storageCapacity: res.storageCapacity || prev.storageCapacity,
      color: res.color || prev.color,
      diagnosticInfo: {
        ...(prev.diagnosticInfo || {}),
        ...res.diagnosticInfo
      }
    }));
    setShowRawDumpInput(false);
    setRawDumpText('');
  };

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

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = (phone.sellPrice || 0) - phone.buyPrice - totalExpenses;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0d0d12] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col max-h-[95vh] shadow-2xl"
      >
        {/* Header image */}
        <div className="relative h-56 overflow-hidden shrink-0">
          {phone.imageUrl ? (
            <img src={phone.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
              <ClipboardList className="w-14 h-14 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/40 to-transparent" />

          <button onClick={onClose} className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white/70 hover:text-white transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 left-4 p-2.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-emerald-400 hover:text-emerald-300 transition-colors z-10"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                phone.status === 'In Stock'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : phone.status === 'Personal Use'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                  : phone.status === 'On Sale'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
              }`}>
                {phone.status}
              </span>
              {phone.storageCapacity && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white/8 text-white/60 border border-white/5">
                  {phone.storageCapacity}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{phone.model}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-hide">
          {isEditing ? (
            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-emerald-400">Edit Device</h3>
                <button
                  onClick={() => setShowRawDumpInput(s => !s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto-Fill from 3uTools</span>
                </button>
              </div>

              {showRawDumpInput && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/5 border border-emerald-500/30 p-4 rounded-xl space-y-3 mb-4 overflow-hidden">
                  <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wide">Paste raw text output from 3uTools / iMazing:</p>
                  <textarea
                    value={rawDumpText}
                    onChange={e => setRawDumpText(e.target.value)}
                    placeholder="ActivationState Activated&#10;DeviceName iPhone&#10;ProductType iPhone15,3..."
                    className="w-full h-28 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white/80 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowRawDumpInput(false)} className="px-3 py-2 bg-white/5 text-white/60 font-bold uppercase text-[10px] rounded-lg hover:bg-white/10 transition-colors cursor-pointer">Cancel</button>
                    <button onClick={handleParseRawDumpEdit} className="px-4 py-2 bg-emerald-500 text-black font-bold uppercase text-[10px] rounded-lg hover:bg-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Apply
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <EditField label="Model" value={editData.model || ''} onChange={v => setEditData(p => ({ ...p, model: v }))} />
                <EditField label="IMEI" value={editData.imei || ''} onChange={v => setEditData(p => ({ ...p, imei: v }))} />
                <EditField label="Buy Price" type="number" value={editData.buyPrice?.toString() || ''} onChange={v => setEditData(p => ({ ...p, buyPrice: parseFloat(v) }))} />
                <EditField label="Storage" value={editData.storageCapacity || ''} onChange={v => setEditData(p => ({ ...p, storageCapacity: v }))} />
                <EditField label="Color" value={editData.color || ''} onChange={v => setEditData(p => ({ ...p, color: v }))} />
                <EditField label="Battery %" type="number" value={editData.batteryHealth?.toString() || ''} onChange={v => setEditData(p => ({ ...p, batteryHealth: parseInt(v) }))} />
              </div>
              <EditField label="Buy Location" value={editData.buyLocation || ''} onChange={v => setEditData(p => ({ ...p, buyLocation: v }))} />
              <EditField label="Seller Name" value={editData.sellerName || ''} onChange={v => setEditData(p => ({ ...p, sellerName: v }))} />
              <EditField label="Seller Contact" value={editData.sellerNumber || ''} onChange={v => setEditData(p => ({ ...p, sellerNumber: v }))} />
              <EditField label="Remarks" value={editData.remarks || ''} onChange={v => setEditData(p => ({ ...p, remarks: v }))} />

              {phone.status === 'Sale' && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-blue-400">Sale Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="Sold Price" type="number" value={editData.sellPrice?.toString() || ''} onChange={v => setEditData(p => ({ ...p, sellPrice: parseFloat(v) }))} />
                    <EditField label="Sold Date" type="date" value={editData.sellDate || ''} onChange={v => setEditData(p => ({ ...p, sellDate: v }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="Buyer Name" value={editData.buyerName || ''} onChange={v => setEditData(p => ({ ...p, buyerName: v }))} />
                    <EditField label="Buyer Number" value={editData.buyerNumber || ''} onChange={v => setEditData(p => ({ ...p, buyerNumber: v }))} />
                  </div>
                  <EditField label="Sold Location" value={editData.sellLocation || ''} onChange={v => setEditData(p => ({ ...p, sellLocation: v }))} />
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-white/40">Device Photo</h4>
                <label className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-emerald-500/40 transition-all flex flex-col items-center text-center cursor-pointer group">
                  <Camera className="w-5 h-5 text-white/40 group-hover:text-emerald-500 mb-2 transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">Upload Photo</span>
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>

                {isUploading && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-3">
                    <UploadCloud className="w-4 h-4 text-blue-500 animate-bounce" />
                    <span className="text-xs font-bold text-blue-400">Uploading...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-white/5 rounded-xl font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={handleUpdate} className="flex-[2] py-4 bg-emerald-500 text-black rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 cursor-pointer hover:bg-emerald-400 transition-colors">Save Changes</button>
              </div>
            </div>
          ) : (
            <>
              {/* Quick specs */}
              <div className="grid grid-cols-2 gap-2.5">
                <InfoBox label="IMEI" value={phone.imei} />
                <InfoBox label="Serial" value={phone.serialNumber || 'N/A'} />
                <InfoBox label="Battery" value={`${phone.batteryHealth ?? '??'}%`} />
                <InfoBox label="Color" value={phone.color || 'N/A'} />
              </div>

              {/* Buy Info */}
              <Section title="Purchase">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/50">Buy Price</p>
                        {totalExpenses > 0 && (
                          <p className="text-[9px] font-bold text-white/25 uppercase tracking-wide mt-0.5">
                            + रु {totalExpenses.toLocaleString()} overhead
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold font-mono text-emerald-400">रु {phone.buyPrice.toLocaleString()}</p>
                      {totalExpenses > 0 && (
                        <p className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-wide">
                          Total: रु {(phone.buyPrice + totalExpenses).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <DetailItem icon={<Calendar className="w-3.5 h-3.5" />} label="Date" value={phone.buyDate} />
                    <DetailItem icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={phone.buyLocation || 'N/A'} />
                    <DetailItem icon={<User className="w-3.5 h-3.5" />} label="Seller" value={phone.sellerName || 'N/A'} />
                    <DetailItem icon={<PhoneIcon className="w-3.5 h-3.5" />} label="Contact" value={phone.sellerNumber || 'N/A'} />
                  </div>

                  {phone.reportUrl && (
                    <a
                      href={phone.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">View 3uTools Report</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-500/50 group-hover:text-emerald-500 transition-all" />
                    </a>
                  )}
                </div>
              </Section>

              {/* Sale Info / Sell Form */}
              {phone.status === 'Sold' ? (
                <Section title="Sale">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-blue-500/5 rounded-xl border border-blue-500/15">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <DollarSign className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-xs font-medium text-white/50">Sold Price</p>
                      </div>
                      <p className="text-lg font-bold font-mono text-blue-400">रु {phone.sellPrice?.toLocaleString()}</p>
                    </div>

                    <div className="bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-500/15">
                      <p className="text-[10px] uppercase font-bold text-emerald-500/70 mb-1">Net Profit</p>
                      <p className={`text-xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        रु {netProfit.toLocaleString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <DetailItem icon={<User className="w-3.5 h-3.5" />} label="Buyer" value={phone.buyerName || 'N/A'} />
                      <DetailItem icon={<PhoneIcon className="w-3.5 h-3.5" />} label="Number" value={phone.buyerNumber || 'N/A'} />
                      <DetailItem icon={<Calendar className="w-3.5 h-3.5" />} label="Sold Date" value={phone.sellDate || 'N/A'} />
                      <DetailItem icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={phone.sellLocation || 'N/A'} />
                    </div>
                  </div>
                </Section>
              ) : isSelling ? (
                <Section title="Mark as Sold">
                  <div className="space-y-3 bg-white/[0.02] p-5 rounded-xl border border-white/[0.06]">
                    <div className="grid grid-cols-2 gap-3">
                      <EditField label="Sell Price" type="number" value={sellData.sellPrice} onChange={v => setSellData(p => ({ ...p, sellPrice: v }))} />
                      <EditField label="Sell Date" type="date" value={sellData.sellDate} onChange={v => setSellData(p => ({ ...p, sellDate: v }))} />
                    </div>
                    <EditField label="Buyer Name" value={sellData.buyerName} onChange={v => setSellData(p => ({ ...p, buyerName: v }))} icon={<User className="w-3.5 h-3.5" />} />
                    <EditField label="Buyer Number" value={sellData.buyerNumber} onChange={v => setSellData(p => ({ ...p, buyerNumber: v }))} icon={<PhoneIcon className="w-3.5 h-3.5" />} />
                    <EditField label="Sell Location" value={sellData.sellLocation} onChange={v => setSellData(p => ({ ...p, sellLocation: v }))} icon={<MapPin className="w-3.5 h-3.5" />} />

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setIsSelling(false)} className="flex-1 py-3.5 bg-white/5 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-colors">Cancel</button>
                      <button onClick={handleSell} className="flex-[2] py-3.5 bg-blue-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-400 transition-colors">
                        <CheckCircle2 className="w-4 h-4" /> Finalize Sale
                      </button>
                    </div>
                  </div>
                </Section>
              ) : (
                <button
                  onClick={() => setIsSelling(true)}
                  className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold uppercase text-xs tracking-[0.15em] shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Mark as Sold
                </button>
              )}

              {/* Expenses */}
              <Section title="Expenses">
                <div className="space-y-3">
                  {expenses.length === 0 ? (
                    <div className="p-6 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-center">
                      <Wrench className="w-6 h-6 text-white/10 mb-2" />
                      <p className="text-[10px] font-bold uppercase text-white/20 tracking-wide">No expenses recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {expenses.map(e => (
                        <div key={e.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${e.category === 'Repair' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
                              <AlertCircle className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase text-white/30">{e.category}</p>
                              <p className="text-[11px] font-medium">{e.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold font-mono">रु {e.amount.toLocaleString()}</p>
                            <button onClick={() => onDeleteExpense(e.id)} className="text-[8px] font-bold uppercase text-red-500/40 hover:text-red-500 transition-colors">Remove</button>
                          </div>
                        </div>
                      ))}
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase text-emerald-500/50 tracking-wide">Total Overhead</p>
                        <p className="text-sm font-bold font-mono text-emerald-500">रु {totalExpenses.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {!showExpenses ? (
                    <button
                      onClick={() => setShowExpenses(true)}
                      className="w-full py-3 border border-white/[0.06] rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wide text-white/40 hover:bg-white/[0.03] transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Expense
                    </button>
                  ) : (
                    <div className="bg-white/[0.02] p-5 rounded-xl border border-white/[0.06] space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase text-white/30 font-bold tracking-wide ml-0.5">Category</p>
                          <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-xs font-bold focus:outline-none focus:border-emerald-500 appearance-none"
                            value={expenseForm.category}
                            onChange={(e) => setExpenseForm(p => ({ ...p, category: e.target.value as 'Repair' | 'Misc' }))}
                          >
                            <option value="Repair">Repair</option>
                            <option value="Misc">Misc</option>
                          </select>
                        </div>
                        <EditField label="Amount" type="number" value={expenseForm.amount} onChange={v => setExpenseForm(p => ({ ...p, amount: v }))} />
                      </div>
                      <EditField label="Description" value={expenseForm.description} onChange={v => setExpenseForm(p => ({ ...p, description: v }))} />
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setShowExpenses(false)} className="flex-1 py-2.5 bg-white/5 rounded-lg font-bold uppercase text-[10px] hover:bg-white/10 transition-colors">Cancel</button>
                        <button
                          onClick={() => {
                            if (!expenseForm.amount || !expenseForm.description) {
                              alert('Please enter amount and description');
                              return;
                            }
                            onAddExpense({
                              phoneId: phone.id,
                              category: expenseForm.category,
                              amount: parseFloat(expenseForm.amount),
                              description: expenseForm.description,
                              date: new Date().toISOString().split('T')[0]
                            });
                            setExpenseForm({ category: 'Repair', amount: '', description: '' });
                            setShowExpenses(false);
                          }}
                          className="flex-1 py-2.5 bg-emerald-500 text-black rounded-lg font-bold uppercase text-[10px] hover:bg-emerald-400 transition-colors"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              {/* Remarks */}
              {phone.remarks && (
                <Section title="Remarks">
                  <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                    <p className="text-xs font-medium text-white/40 italic leading-relaxed">"{phone.remarks}"</p>
                  </div>
                </Section>
              )}

              {/* Diagnostics */}
              {phone.diagnosticInfo && Object.keys(phone.diagnosticInfo).length > 0 && (
                <Section title="Diagnostics">
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowDiagnostics(s => !s)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/15">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white/80">3uTools Data</h4>
                          <p className="text-[10px] text-white/30">{Object.keys(phone.diagnosticInfo).length} data points</p>
                        </div>
                      </div>
                      {showDiagnostics ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </button>

                    {showDiagnostics && (
                      <div className="p-4 pt-0 border-t border-white/[0.03] max-h-80 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                        {Object.entries(phone.diagnosticInfo).map(([key, val]) => (
                          <div key={key} className="flex justify-between py-1.5 border-b border-white/[0.02] gap-4">
                            <span className="text-white/30 truncate">{key}</span>
                            <span className="text-white/70 font-medium text-right shrink-0">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* Footer actions */}
          <div className="pt-4 pb-8 flex justify-between items-center px-1">
            <button
              onClick={() => { if (confirm('Delete this device permanently?')) onDelete(phone.id); }}
              className="p-3 bg-red-500/5 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/15"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-white/15">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Added {new Date(phone.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <div className="w-0.5 h-2.5 bg-emerald-500 rounded-full" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
      <p className="text-[9px] uppercase font-bold text-white/20 mb-0.5">{label}</p>
      <p className="text-xs font-semibold truncate">{value}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 bg-white/[0.02] rounded-lg">
      <div className="text-white/15">{icon}</div>
      <div className="min-w-0">
        <p className="text-[8px] uppercase font-bold text-white/20 leading-none mb-0.5">{label}</p>
        <p className="text-[10px] font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', icon }: { label: string; value: string; onChange: (v: string) => void; type?: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1.5 group">
      <p className="text-[10px] uppercase text-white/30 font-bold tracking-wide ml-0.5">{label}</p>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full bg-white/5 border border-white/10 rounded-lg py-2.5 ${icon ? 'pl-10' : 'px-3'} pr-3 text-xs font-semibold focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all`}
        />
      </div>
    </div>
  );
}
