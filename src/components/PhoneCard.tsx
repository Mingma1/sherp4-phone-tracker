import React from 'react';
import { Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import type { Phone, Expense } from '../types';

interface PhoneCardProps {
  phone: Phone;
  expenses: Expense[];
  onClick: () => void;
}

export default function PhoneCard({ phone, expenses, onClick }: PhoneCardProps) {
  const buyPrice = phone.buyPrice || 0;
  const totalCost = buyPrice + expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

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
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
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
            phone.status === 'Personal Use' ? 'bg-purple-500 text-white' :
            'bg-amber-500 text-black'
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
            {(phone.imei || '').slice(-8)} • {phone.color || '—'}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="font-mono text-emerald-400 font-black text-sm">रु {totalCost.toLocaleString()}</p>
          <span className="text-[9px] font-mono text-white/40 font-bold">
            {phone.batteryHealth ? `${phone.batteryHealth}%` : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
