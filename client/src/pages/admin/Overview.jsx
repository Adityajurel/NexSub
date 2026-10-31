import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { useDemoClock } from '../../context/DemoClockContext';
import {
  TrendingUp,
  Users,
  Repeat,
  DollarSign,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { effectiveDate, setIsClockModalOpen } = useDemoClock();

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/overview');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [effectiveDate]);

  if (loading && !data) return <Loader message="Compiling executive subscription analytics..." />;

  const { metrics, charts, overdueInvoices = [], upcomingRenewals = [] } = data || {};

  const kpis = [
    {
      label: 'Monthly Recurring Revenue',
      value: `Rs. ${metrics?.mrr?.toLocaleString('en-IN') || '0'}`,
      subtext: `ARR: Rs. ${metrics?.arr?.toLocaleString('en-IN') || '0'}`,
      icon: TrendingUp,
      color: 'text-sky-600',
      bg: 'bg-sky-50'
    },
    {
      label: 'Active Subscriptions',
      value: metrics?.totalActiveSubscriptions || 0,
      subtext: `${metrics?.totalCustomers || 0} Registered Customers`,
      icon: Repeat,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Total Collected Revenue',
      value: `Rs. ${metrics?.totalRevenueCollected?.toLocaleString('en-IN') || '0'}`,
      subtext: `Outstanding: Rs. ${metrics?.totalOutstanding?.toLocaleString('en-IN') || '0'}`,
      icon: DollarSign,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Overdue Invoices',
      value: metrics?.overdueCount || 0,
      subtext: `Total Due: Rs. ${metrics?.overdueTotal?.toLocaleString('en-IN') || '0'}`,
      icon: AlertOctagon,
      color: metrics?.overdueCount > 0 ? 'text-rose-600' : 'text-slate-600',
      bg: metrics?.overdueCount > 0 ? 'bg-rose-50' : 'bg-slate-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial indicators, automated recurring billing status, and subscription health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchOverview}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsClockModalOpen(true)}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5 text-sky-400" /> Run Demo Clock
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-5 hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {kpi.label}
                </span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-3">{kpi.value}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>{kpi.subtext}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 block">Failed Payments (Dunning)</span>
            <span className="text-lg font-bold text-slate-900">{metrics?.failedPaymentsCount || 0} incidents</span>
          </div>
          <Badge status={metrics?.failedPaymentsCount > 0 ? 'failed' : 'active'}>
            {metrics?.failedPaymentsCount > 0 ? 'Needs Attention' : 'Healthy'}
          </Badge>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 block">Recovered Revenue</span>
            <span className="text-lg font-bold text-emerald-600">
              Rs. {metrics?.recoveredRevenue?.toLocaleString('en-IN') || '0'}
            </span>
          </div>
          <Badge status="paid">Smart Dunning Active</Badge>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-500 block">Upcoming Renewals (7 Days)</span>
            <span className="text-lg font-bold text-sky-600">{upcomingRenewals.length} accounts</span>
          </div>
          <Badge status="confirmed">Pipeline Ready</Badge>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Growth Chart */}
        <Card title="Monthly Revenue Trajectory (Rs.)" subtitle="Actual collected revenue from subscriptions" className="lg:col-span-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.revenueTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(value) => [`Rs. ${value.toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subscription Status Distribution */}
        <Card title="Subscription Portfolio Status" subtitle="Active vs Paused vs Expired/Closed">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(charts?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs mt-2">
            {(charts?.statusDistribution || []).map((st, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.fill }} />
                <span className="text-slate-600 font-medium">{st.name}:</span>
                <span className="font-bold text-slate-900">{st.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Actionable Overdue Invoices and Renewals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Invoices Attention Table */}
        <Card
          title="Critical: Overdue Invoices Requiring Dunning"
          subtitle="Invoices where payment due date has passed with outstanding balance"
        >
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> All invoices are currently paid and up to date!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {overdueInvoices.map((inv) => (
                <div key={inv._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">{inv.invoiceNumber}</span>
                    <span className="text-slate-500">{inv.customerId?.name || inv.customerId?.companyName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 block">Rs. {inv.amountDue.toFixed(2)}</span>
                    <Badge status="overdue">Overdue</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Renewals */}
        <Card
          title="Upcoming Subscription Renewals"
          subtitle="Subscriptions due for automatic recurring invoice generation"
        >
          {upcomingRenewals.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No renewals scheduled in the immediate 7-day window.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {upcomingRenewals.map((sub) => (
                <div key={sub._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">{sub.subscriptionNumber}</span>
                    <span className="text-slate-500">{sub.customerId?.name} ({sub.planId?.name})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">Rs. {sub.totalAmount.toFixed(2)}</span>
                    <span className="text-slate-400 text-[11px]">
                      Due {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
