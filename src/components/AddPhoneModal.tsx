import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Save,
  MapPin,
  User,
  Phone as PhoneIcon,
  Tag,
  UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone } from '../types';
import { scan3uReport } from '../services/ocrService';
import { storage, ref, uploadBytes, getDownloadURL } from '../services/firebase';

interface AddPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phone: Omit<Phone, 'id' | 'createdAt'>) => void;
}

export default function AddPhoneModal({ isOpen, onClose, onSave }: AddPhoneModalProps) {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Phone>>({
    status: 'In Stock',
    buyDate: new Date().toISOString().split('T')[0],
  });

  const [previews, setPreviews] = useState<{ phone?: string; report?: string }>({});

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'phone' | 'report') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Local preview
      const url = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [type]: url }));

      // Upload to Firebase Storage
      const storageRef = ref(storage, `inventory/${Date.now()}_${type}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setFormData(prev => ({
        ...prev,
        [type === 'phone' ? 'imageUrl' : 'reportUrl']: downloadURL
      }));

      if (type === 'report') {
        handleOCR(file);
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOCR = async (file: File) => {
    setIsScanning(true);
    try {
      const results = await scan3uReport(file);
      setFormData(prev => ({
        ...prev,
        model: results.model || prev.model,
        imei: results.imei || prev.imei,
        serialNumber: results.serialNumber || prev.serialNumber,
        batteryHealth: results.batteryHealth || prev.batteryHealth,
        storageCapacity: results.storageCapacity || prev.storageCapacity,
      }));
    } catch (err) {
      console.error('OCR failed', err);
    } finally {
      setIsScanning(false);
    }
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[10px] uppercase text-white/40 font-black tracking-widest ml-1">Phone Photo</p>
                  <label className="relative aspect-square rounded-3xl bg-white/5 border-2 border-dashed border-white/10 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                    {previews.phone ? (
                      <img src={previews.phone} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-white/20 group-hover:text-emerald-500 transition-colors mb-2" />
                        <span className="text-[10px] font-bold text-white/20">UPLOAD</span>
                      </>
                    )}
                    <input type="file" className="hidden" onChange={(e) => handleImageChange(e, 'phone')} accept="image/*" />
                  </label>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] uppercase text-white/40 font-black tracking-widest ml-1">3uTools Report</p>
                  <label className="relative aspect-square rounded-3xl bg-white/5 border-2 border-dashed border-white/10 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                    {previews.report ? (
                      <div className="relative w-full h-full">
                        <img src={previews.report} className="w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-8 h-8 text-white/20 group-hover:text-emerald-500 transition-colors mb-2" />
                        <span className="text-[10px] font-bold text-white/20">SCAN REPORT</span>
                      </>
                    )}
                    <input type="file" className="hidden" onChange={(e) => handleImageChange(e, 'report')} accept="image/*" />
                  </label>
                </div>
              </div>

              {isUploading && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-blue-500 animate-bounce" />
                  <span className="text-xs font-bold text-blue-400">Uploading media to secure storage...</span>
                </div>
              )}

              {isScanning && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  <span className="text-xs font-bold text-emerald-500">Extracting data from 3uTools...</span>
                </div>
              )}

              <div className="space-y-4">
                <InputGroup label="Device Specifications">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Model" value={formData.model} onChange={v => setFormData(p => ({ ...p, model: v }))} placeholder="e.g. iPhone 15 Pro" />
                    <Field label="IMEI" value={formData.imei} onChange={v => setFormData(p => ({ ...p, imei: v }))} placeholder="15 Digit Number" />
                    <Field label="Serial No" value={formData.serialNumber} onChange={v => setFormData(p => ({ ...p, serialNumber: v }))} />
                    <Field label="Storage" value={formData.storageCapacity} onChange={v => setFormData(p => ({ ...p, storageCapacity: v }))} placeholder="e.g. 256GB" />
                    <Field label="Battery Health" value={formData.batteryHealth?.toString()} onChange={v => setFormData(p => ({ ...p, batteryHealth: parseInt(v) }))} type="number" />
                    <Field label="Color" value={formData.color} onChange={v => setFormData(p => ({ ...p, color: v }))} />
                  </div>
                </InputGroup>
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
