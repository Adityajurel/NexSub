import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDemoClock } from '../../context/DemoClockContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { DemoClockModal } from '../common/DemoClockModal';
import { AIAssistantModal } from '../common/AIAssistantModal';
import { Clock, Sparkles } from 'lucide-react';

export const Topbar = () => {
  const { user, role } = useAuth();
  const { effectiveDate, isSimulated, setIsClockModalOpen } = useDemoClock();
  const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);

  return (
    <>
      <header className="h-16 bg-[#fffdf9]/90 border-b border-[#e5ded2] px-6 flex items-center justify-between z-10 shrink-0 backdrop-blur">
        <div className="flex items-center gap-3">
          {/* Demo Clock Pill */}
          <button
            onClick={() => setIsClockModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isSimulated
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 ring-2 ring-amber-200'
                : 'bg-[#fcfbf8] text-[#5b554d] border-[#ded7cb] hover:bg-[#f7f1e5]'
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
          {(role === 'Admin' || role === 'Staff') && (
            <Button
              type="button"
              variant="brand"
              onClick={() => setIsAssistantOpen(true)}
              aria-label="Open AI assistant"
              className="min-w-[104px] gap-2 rounded-xl !bg-[#171717] px-4 py-2.5 font-bold !text-white shadow-[0_6px_16px_rgba(23,23,23,0.18)] hover:!bg-[#302d29] focus:ring-[#f5c875]"
            >
              <Sparkles className="h-4 w-4 text-[#f5c875]" />
              <span className="hidden sm:inline">Ask AI</span>
              <span className="sm:hidden">AI</span>
            </Button>
          )}

          {/* Role badge */}
          <Badge status={role}>{role}</Badge>

          {/* User initials pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#e5ded2]">
            <div className="w-8 h-8 rounded-full bg-[#f5c875] text-[#171717] flex items-center justify-center font-black text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <span className="font-bold text-[#171717] block leading-tight">{user?.name}</span>
              <span className="text-[#8b857b] text-[11px] block">{user?.companyName || user?.role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <DemoClockModal />
      <AIAssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </>
  );
};
