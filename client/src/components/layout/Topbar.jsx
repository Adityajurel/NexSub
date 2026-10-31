import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDemoClock } from '../../context/DemoClockContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { DemoClockModal } from '../common/DemoClockModal';
import { Clock } from 'lucide-react';

export const Topbar = () => {
  const { user, role } = useAuth();
  const { effectiveDate, isSimulated, setIsClockModalOpen } = useDemoClock();

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Demo Clock Pill */}
          <button
            onClick={() => setIsClockModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isSimulated
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 ring-2 ring-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Click to control Demo Clock & simulate billing cycles"
          >
            <Clock className={`w-3.5 h-3.5 ${isSimulated ? 'text-amber-600 animate-spin-slow' : 'text-slate-500'}`} />
            <span>
              {isSimulated ? 'Simulated: ' : 'System Date: '}
              {effectiveDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-white/70 rounded text-slate-600">
              {isSimulated ? 'Time Travel' : 'Demo Clock'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Role badge */}
          <Badge status={role}>{role}</Badge>

          {/* User initials pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <span className="font-semibold text-slate-900 block leading-tight">{user?.name}</span>
              <span className="text-slate-500 text-[11px] block">{user?.companyName || user?.role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <DemoClockModal />
    </>
  );
};
