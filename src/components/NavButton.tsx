import React from 'react';
import { motion } from 'motion/react';

interface NavButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export default function NavButton({ active, icon, label, onClick }: NavButtonProps) {
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
