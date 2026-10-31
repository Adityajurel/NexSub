import React from 'react';

const statusStyles = {
  // Green
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Amber
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  quotation: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',

  // Red
  overdue: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold animate-pulse',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  expired: 'bg-rose-50 text-rose-700 border-rose-200',
  abandoned: 'bg-rose-50 text-rose-700 border-rose-200',

  // Blue / Brand
  confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  created: 'bg-sky-50 text-sky-700 border-sky-200',
  live: 'bg-sky-50 text-sky-700 border-sky-200',

  // Slate / Neutral
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  skipped_duplicate: 'bg-purple-50 text-purple-700 border-purple-200',
  dry_run: 'bg-indigo-50 text-indigo-700 border-indigo-200',

  // Role badges
  admin: 'bg-[#f3eaff] text-[#6d42a5] border-[#dfc9fa] font-bold',
  staff: 'bg-[#e9f4ff] text-[#28658f] border-[#c8e4fa] font-bold',
  customer: 'bg-[#fff4d8] text-[#946b1f] border-[#f1d99c] font-bold'
};

export const Badge = ({ status, children, className = '' }) => {
  const key = (status || children || '').toString().toLowerCase().replace(/\s+/g, '_');
  const style = statusStyles[key] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {children || status}
    </span>
  );
};
