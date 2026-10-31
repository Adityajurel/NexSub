import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const MarginGuardBadge = ({ alert, shortfall = 0, warnings = [] }) => {
  if (!alert) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3.5 h-3.5" />
        Margin Safe
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 shadow-xs">
      <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
      <span>
        MARGIN GUARD WARNING: Price below cost basis {shortfall > 0 ? `(-Rs. ${shortfall.toFixed(2)})` : ''}
      </span>
    </div>
  );
};
