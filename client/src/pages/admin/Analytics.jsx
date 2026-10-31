import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Tag,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export const Analytics = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/financials', { params: { range } });
      if (res.data.success) {
        setReport(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [range]);

  const handleExportCSV = () => {
    window.open('/api/reports/export-csv', '_blank');
  };

  if (loading && !report) return <Loader message="Compiling financial intelligence reports..." />;

  const { summary = {}, invoices = [], payments = [] } = report || {};

  const chartData = [
    { name: 'Invoiced Amount', amount: summary.totalInvoiced || 0, fill: '#0ea5e9' },
    { name: 'Revenue Collected', amount: summary.totalCollected || 0, fill: '#10b981' },
    { name: 'Discounts Granted', amount: summary.totalDiscountsGiven || 0, fill: '#f59e0b' },
    { name: 'Taxes Collected', amount: summary.totalTaxesCollected || 0, fill: '#6366f1' },
    { name: 'Debt Recovered', amount: summary.totalRecovered || 0, fill: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance & Revenue Intelligence</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconciliation reporting, discounts impact, statutory taxes collected, and cash flows
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs shadow-xs">
            {['7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  range === r ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <Button size="sm" variant="secondary" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Total Invoiced</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            Rs. {summary.totalInvoiced?.toLocaleString('en-IN') || '0'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">{summary.invoicesCount || 0} Invoices</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block">Total Collected</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">
            Rs. {summary.totalCollected?.toLocaleString('en-IN') || '0'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">{summary.paymentsCount || 0} Transactions</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 block">Discounts Given</span>
          <span className="text-xl font-bold text-amber-600 mt-1 block">
            Rs. {summary.totalDiscountsGiven?.toLocaleString('en-IN') || '0'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Promotional Impact</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 block">Taxes Collected</span>
          <span className="text-xl font-bold text-indigo-600 mt-1 block">
            Rs. {summary.totalTaxesCollected?.toLocaleString('en-IN') || '0'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">GST 18% Liability</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 block">Recovered Debt</span>
          <span className="text-xl font-bold text-purple-600 mt-1 block">
            Rs. {summary.totalRecovered?.toLocaleString('en-IN') || '0'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Smart Dunning Engine</span>
        </Card>
      </div>

      {/* Financial Bar Breakdown Chart */}
      <Card title="Cash Flow & Ledger Composition (Rs.)" subtitle="Comparing invoiced, collected, discount, and tax totals">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                formatter={(val) => [`Rs. ${val.toLocaleString('en-IN')}`, 'Amount']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
