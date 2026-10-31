import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useDemoClock } from '../../context/DemoClockContext';
import { Settings as SettingsIcon, Clock, ShieldCheck, Key, Users, RefreshCw, Cpu, Layers } from 'lucide-react';

export const Settings = () => {
  const { effectiveDate, isSimulated, resetDate, advanceDate, setIsClockModalOpen } = useDemoClock();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Configurations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Hackathon simulation controls, payment gateway parameters, and team responsibilities
        </p>
      </div>

      {/* Demo Clock Quick Card */}
      <Card title="Demo Clock Time Travel Engine" subtitle="Simulate future dates and billing cycles without modifying the system clock">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-sky-600" />
              <div>
                <span className="text-xs text-slate-500 font-semibold block uppercase">Current Effective Time</span>
                <span className="text-base font-bold text-slate-900">
                  {effectiveDate.toLocaleString()} {isSimulated ? '(Simulated Future)' : '(Real Time)'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setIsClockModalOpen(true)}>
                Open Demo Clock
              </Button>
              {isSimulated && (
                <Button size="sm" variant="ghost" onClick={resetDate}>
                  Reset Real Time
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Gateway Status */}
      <Card title="Payment Gateway Integration" subtitle="Configured for Test Mode reconciliation">
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="font-semibold text-slate-900 block">Razorpay Test Mode Gateway</span>
              <span className="text-slate-500 font-mono">Key ID: rzp_test_nexsub123456</span>
            </div>
            <Badge status="active">Test Mode Ready</Badge>
          </div>
          <p className="text-slate-500">
            Webhook signature verification and order creation are active in test mode. Duplicate webhook replay protection is strictly enforced.
          </p>
        </div>
      </Card>

      {/* Team Allocation & Hackathon Credits */}
      <Card title="NexSub Core Engineering Team" subtitle="Documented Hackathon Responsibilities & Architecture Allocation">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 text-sm block">Aditya Jurel</span>
            <span className="text-sky-600 font-semibold block mb-2">Backend Architect</span>
            <p className="text-slate-600 leading-relaxed">
              Authentication, RBAC security, Customer Isolation, Catalog (Products & Variants), Docker containerization, and Deployment pipelines.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 text-sm block">Anupam Dwivedi</span>
            <span className="text-emerald-600 font-semibold block mb-2">Backend Engineer</span>
            <p className="text-slate-600 leading-relaxed">
              Centralized Pricing Engine, Margin Guard, Idempotent Recurring Billing Runs, MongoDB locking, State Machines, and Payment Recovery (Dunning).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 text-sm block">Avichal Bajpai</span>
            <span className="text-purple-600 font-semibold block mb-2">Frontend & UI/UX</span>
            <p className="text-slate-600 leading-relaxed">
              Admin Executive Dashboard, Staff Consoles, Customer Self-Service Portal, Interactive Demo Clock, Recharts Financial Analytics, and UI Design System.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
