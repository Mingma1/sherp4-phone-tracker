import React, { useState } from 'react';
import { 
  X,
  Camera, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Save,
  MapPin,
  User,
  Phone as PhoneIcon,
  Tag,
  UploadCloud,
  Zap
} from 'lucide-react';
import { parse3uDump } from '../services/parse3uDump';
import { motion, AnimatePresence } from 'motion/react';
import { Phone } from '../types';
import { storage, ref, uploadBytes, getDownloadURL } from '../services/firebase';

interface AddPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phone: Omit<Phone, 'id' | 'createdAt'>) => void;
}

export default function AddPhoneModal({ isOpen, onClose, onSave }: AddPhoneModalProps) {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [showRawDumpInput, setShowRawDumpInput] = useState(false);
  const [rawDumpText, setRawDumpText] = useState('');
  
  const [formData, setFormData] = useState<Partial<Phone>>({
    status: 'In Stock',
    buyDate: new Date().toISOString().split('T')[0],
  });

  const [previews, setPreviews] = useState<{ phone?: string }>({});

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Local preview
      const url = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, phone: url }));

      // Upload to Firebase Storage
      const storageRef = ref(storage, `inventory/${Date.now()}_phone_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setFormData(prev => ({
        ...prev,
        imageUrl: downloadURL
      }));
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleParseRawDump = () => {
    if (!rawDumpText.trim()) return;
    const res = parse3uDump(rawDumpText);
    setFormData(prev => ({
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


  const handleSubmit = () => {
    if (!formData.buyPrice) {
      alert('Please fill in the Buy Price');
      return;
    }
    const finalData = {
      ...formData,
      model: formData.model || 'Unknown Device',
      imei: formData.imei || `TEMP-${Math.floor(100000 + Math.random() * 900000)}`
    };
    onSave(finalData as Omit<Phone, 'id' | 'createdAt'>);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Add New Device</h2>
            <p className="text-[10px] uppercase text-white/30 font-bold tracking-widest mt-1">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-hide">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="space-y-3">
                <p className="text-[10px] uppercase text-white/40 font-black tracking-widest ml-1">Phone Photo</p>
                <label className="relative h-48 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                  {previews.phone ? (
                    <img src={previews.phone} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-white/20 group-hover:text-emerald-500 transition-colors mb-2" />
                      <span className="text-[10px] font-bold text-white/20">UPLOAD DEVICE PHOTO</span>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
              </div>

              {isUploading && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-blue-500 animate-bounce" />
                  <span className="text-xs font-bold text-blue-400">Uploading media to secure storage...</span>
                </div>
              )}


              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/20 ml-1">Device Specifications</h3>
                  <button 
                    onClick={() => setShowRawDumpInput(s => !s)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Auto-Fill from 3uTools Dump</span>
                  </button>
                </div>

                {showRawDumpInput && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/5 border border-emerald-500/30 p-4 rounded-3xl space-y-3 overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Paste raw text output from 3uTools / iMazing device info:</p>
                    <textarea 
                      value={rawDumpText}
                      onChange={e => setRawDumpText(e.target.value)}
                      placeholder="ActivationState Activated&#10;DeviceName Mingma's iPhone&#10;ProductType iPhone15,3..."
                      className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-3 text-xs font-mono text-white/80 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowRawDumpInput(false)} className="px-3 py-2 bg-white/5 text-white/60 font-bold uppercase text-[10px] rounded-xl hover:bg-white/10 transition-colors cursor-pointer">Cancel</button>
                      <button onClick={handleParseRawDump} className="px-4 py-2 bg-emerald-500 text-black font-black uppercase text-[10px] rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Apply Extracted Data
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Model" value={formData.model} onChange={v => setFormData(p => ({ ...p, model: v }))} placeholder="e.g. iPhone 15 Pro" />
                  <Field label="IMEI" value={formData.imei} onChange={v => setFormData(p => ({ ...p, imei: v }))} placeholder="15 Digit Number" />
                  <Field label="Serial No" value={formData.serialNumber} onChange={v => setFormData(p => ({ ...p, serialNumber: v }))} />
                  <Field label="Storage" value={formData.storageCapacity} onChange={v => setFormData(p => ({ ...p, storageCapacity: v }))} placeholder="e.g. 256GB" />
                  <Field label="Battery Health" value={formData.batteryHealth?.toString()} onChange={v => setFormData(p => ({ ...p, batteryHealth: parseInt(v) }))} type="number" />
                  <Field label="Color" value={formData.color} onChange={v => setFormData(p => ({ ...p, color: v }))} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <InputGroup label="Purchase Details">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Buy Price (NPR)" value={formData.buyPrice?.toString()} onChange={v => setFormData(p => ({ ...p, buyPrice: parseFloat(v) }))} type="number" />
                  <Field label="Buy Date" value={formData.buyDate} onChange={v => setFormData(p => ({ ...p, buyDate: v }))} type="date" />
                </div>
                <div className="mt-4 space-y-4">
                  <Field label="Buy Location" value={formData.buyLocation} onChange={v => setFormData(p => ({ ...p, buyLocation: v }))} icon={<MapPin className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Seller Name" value={formData.sellerName} onChange={v => setFormData(p => ({ ...p, sellerName: v }))} icon={<User className="w-4 h-4" />} />
                    <Field label="Seller Number" value={formData.sellerNumber} onChange={v => setFormData(p => ({ ...p, sellerNumber: v }))} icon={<PhoneIcon className="w-4 h-4" />} />
                  </div>
                </div>
              </InputGroup>

              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                <p className="text-[10px] uppercase text-white/20 font-black tracking-widest mb-4">Initial Condition / Remarks</p>
                <textarea 
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-white/10 min-h-[100px]"
                  placeholder="Scratches, screen replacement, missing parts..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 font-bold mb-1">Set Device Status</p>
                  <p className="text-lg font-black">{formData.status}</p>
                </div>
                <div className="flex gap-2">
                  {['In Stock', 'On Sale', 'Personal Use'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setFormData(p => ({ ...p, status: s as any }))}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                        formData.status === s ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <InputGroup label="Optional: Pre-sale Pricing">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expected Sell Price" value={formData.sellPrice?.toString()} onChange={v => setFormData(p => ({ ...p, sellPrice: parseFloat(v) }))} type="number" />
                  <Field label="Location (Preferred)" value={formData.sellLocation} onChange={v => setFormData(p => ({ ...p, sellLocation: v }))} icon={<Tag className="w-4 h-4" />} />
                </div>
              </InputGroup>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[3rem] text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-xl font-black text-emerald-400">Ready to save</h3>
                <p className="text-sm text-white/40 mt-2 font-medium">Double check IMEI and Price before finalizing.</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-8 bg-black/50 border-t border-white/5 flex gap-4">
          {step > 1 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-5 bg-white/5 rounded-3xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              className="flex-[2] py-5 bg-white text-black rounded-3xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs shadow-xl shadow-white/10 active:scale-95 transition-transform"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              className="flex-[2] py-5 bg-emerald-500 text-black rounded-3xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform"
            >
              <Save className="w-5 h-5" />
              Save Inventory
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InputGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/20 ml-1">{label}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', icon }: { 
  label: string, 
  value?: string, 
  onChange: (v: string) => void, 
  placeholder?: string,
  type?: string,
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-2 group">
      <p className="text-[10px] uppercase text-white/30 font-black tracking-widest ml-1 transition-colors group-focus-within:text-emerald-500">{label}</p>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500">{icon}</div>}
        <input 
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 ${icon ? 'pl-12' : 'px-5'} pr-5 text-sm font-bold focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.08] transition-all`}
        />
      </div>
    </div>
  );
}
