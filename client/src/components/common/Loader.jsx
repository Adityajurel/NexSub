import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-slate-600 mb-2" />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
};
