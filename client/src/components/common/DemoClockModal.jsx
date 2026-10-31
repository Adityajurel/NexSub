import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { useDemoClock } from '../../context/DemoClockContext';
import { Clock, FastForward, Play, RefreshCw, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export const DemoClockModal = () => {
  const {
    effectiveDate,
    isSimulated,
    isClockModalOpen,
    setIsClockModalOpen,
    setCustomDate,
    advanceDate,
    resetDate,
    runSimulatedBilling,
    loading
  } = useDemoClock();

  const [customInputDate, setCustomInputDate] = useState(
    effectiveDate.toISOString().split('T')[0]
  );
  const [billingResult, setBillingResult] = useState(null);
  const [runMode, setRunMode] = useState('LIVE');

  const handleAdvance = async (params) => {
    setBillingResult(null);
    await advanceDate(params);
  };

  const handleCustomSet = async () => {
    if (!customInputDate) return;
    setBillingResult(null);
    await setCustomDate(customInputDate);
  };

  const handleReset = async () => {
    setBillingResult(null);
    await resetDate();
  };

  const handleRunBilling = async () => {
    const res = await runSimulatedBilling(runMode);
    setBillingResult(res);
  };

  return (
    <Modal
      isOpen={isClockModalOpen}
      onClose={() => setIsClockModalOpen(false)}
      title="Hackathon Demo Clock Simulation Engine"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Current status banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isSimulated
            ? 'bg-amber-50/70 border-amber-300 text-amber-900'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSimulated ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
            }`}>
              <Clock className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Effective Date</span>
                {isSimulated ? (
                  <Badge status="paused">Simulated Future</Badge>
                ) : (
                  <Badge status="active">Actual Real Time</Badge>
                )}
              </div>
              <div className="text-lg font-bold">
                {effectiveDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
          {isSimulated && (
            <Button size="sm" variant="secondary" onClick={handleReset} disabled={loading}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Reset Real Time
            </Button>
          )}
        </div>

        {/* Quick jump controls */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Time Travel (Simulate Future Cycles)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAdvance({ days: 1 })}
              disabled={loading}
            >
              +1 Day
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAdvance({ weeks: 1 })}
              disabled={loading}
            >
              +1 Week
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="font-semibold text-slate-900 border-slate-300"
              onClick={() => handleAdvance({ months: 1 })}
              disabled={loading}
            >
              <FastForward className="w-3.5 h-3.5 mr-1 text-sky-600" />
              +1 Month
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAdvance({ years: 1 })}
              disabled={loading}
            >
              +1 Year
            </Button>
          </div>
        </div>

        {/* Custom Date Picker */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="date"
              value={customInputDate}
              onChange={(e) => setCustomInputDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={handleCustomSet} disabled={loading}>
            <Calendar className="w-4 h-4 mr-1" /> Set Date
          </Button>
        </div>

        {/* Run Billing at Simulated Date */}
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Trigger Billing Run at Simulated Date
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates subscriptions due on or before {effectiveDate.toISOString().split('T')[0]}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setRunMode('LIVE')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  runMode === 'LIVE' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                LIVE Run
              </button>
              <button
                onClick={() => setRunMode('DRY_RUN')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  runMode === 'DRY_RUN' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dry Run Preview
              </button>
            </div>
          </div>

          <Button
            size="md"
            variant="brand"
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold"
            onClick={handleRunBilling}
            loading={loading}
          >
            Execute {runMode} Run Now
          </Button>
        </div>

        {/* Billing Result Output */}
        {billingResult && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-900 border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle className="w-4 h-4" /> Run {billingResult.billingRun?.runNumber} Complete
              </span>
              <span>Total Billed: Rs. {billingResult.billingRun?.totalAmountBilled?.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded border border-slate-100">
                <span className="text-slate-400 block">Created</span>
                <span className="text-base font-bold text-emerald-600">{billingResult.billingRun?.totalCreated}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-100">
                <span className="text-slate-400 block">Skipped (Duplicate)</span>
                <span className="text-base font-bold text-slate-600">{billingResult.billingRun?.totalSkipped}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-100">
                <span className="text-slate-400 block">Failed</span>
                <span className="text-base font-bold text-rose-600">{billingResult.billingRun?.totalFailed}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
