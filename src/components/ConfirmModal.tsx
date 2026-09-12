import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  isDestructive = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-[#0d0d12] border border-white/[0.08] rounded-3xl p-6 shadow-2xl z-10"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-2xl ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">{title}</h3>
                <p className="text-xs text-white/50 mt-2 leading-relaxed">{message}</p>
              </div>

              <div className="flex gap-3 w-full pt-4 mt-2 border-t border-white/[0.05]">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onCancel();
                  }}
                  className={`flex-1 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors flex items-center justify-center gap-2 ${
                    isDestructive 
                      ? 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' 
                      : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                  }`}
                >
                  {isDestructive ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
