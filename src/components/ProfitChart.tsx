import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { Phone, Expense } from '../types';

interface ProfitChartProps {
  phones: Phone[];
  expenses: Expense[];
}

/**
 * Dependency-free, theme-matched SVG bar chart of profit per sold device.
 * Inherits the dark theme, mono/Space Grotesk typography and emerald accent.
 */
export default function ProfitChart({ phones, expenses }: ProfitChartProps) {
  const data = React.useMemo(() => {
    return phones
      .filter(p => p && p.status === 'Sold')
      .map(p => {
        const phoneExpenses = expenses
          .filter(e => e && e.phoneId === p.id)
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        const profit = (p.sellPrice || 0) - (p.buyPrice || 0) - phoneExpenses;
        return { id: p.id, label: p.model || 'Unknown', value: profit };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [phones, expenses]);

  const W = 320;
  const H = 180;
  const pad = { top: 16, right: 12, bottom: 28, left: 12 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  if (data.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center">
        <BarChart3 className="w-8 h-8 text-white/10 mb-3" />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
          Profit Breakdown
        </p>
        <p className="text-xs text-white/30 mt-1">
          Sales will appear here once devices are marked as Sale.
        </p>
      </div>
    );
  }

  const maxAbs = Math.max(...data.map(d => Math.abs(d.value)), 1);
  const barGap = 10;
  const barW = Math.max((innerW - barGap * (data.length - 1)) / data.length, 8);
  const zeroY = pad.top + innerH / 2;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-emerald-500 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Profit Breakdown</h3>
        </div>
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
          Top {data.length} Sales
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Profit per sold device">
        <defs>
          <linearGradient id="profit-positive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="profit-negative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Zero baseline */}
        <line
          x1={pad.left}
          y1={zeroY}
          x2={W - pad.right}
          y2={zeroY}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {data.map((d, i) => {
          const x = pad.left + i * (barW + barGap);
          const barH = (Math.abs(d.value) / maxAbs) * (innerH / 2);
          const positive = d.value >= 0;
          const y = positive ? zeroY - barH : zeroY;
          return (
            <g key={d.id}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, 1)}
                rx={4}
                fill={positive ? 'url(#profit-positive)' : 'url(#profit-negative)'}
              />
              <text
                x={x + barW / 2}
                y={positive ? y - 5 : y + barH + 11}
                textAnchor="middle"
                fontSize="8"
                fontFamily="ui-monospace, monospace"
                fill={positive ? '#10b981' : '#ef4444'}
                fontWeight="700"
              >
                {d.value >= 0 ? '+' : ''}{(d.value / 1000).toFixed(d.value % 1000 === 0 ? 0 : 1)}k
              </text>
              <text
                x={x + barW / 2}
                y={H - 10}
                textAnchor="middle"
                fontSize="7"
                fontFamily="ui-monospace, monospace"
                fill="rgba(255,255,255,0.35)"
              >
                {d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-5 pt-1">
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/40">
          <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Gain
        </span>
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/40">
          <span className="w-2 h-2 rounded-sm bg-red-500" /> Loss
        </span>
      </div>
    </div>
  );
}
