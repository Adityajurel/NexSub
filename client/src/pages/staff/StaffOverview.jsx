import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Loader } from '../../components/common/Loader';
import { Link } from 'react-router-dom';
import {
  Users,
  Repeat,
  Receipt,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

export const StaffOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports/overview');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) return <Loader message="Loading operations console..." />;

  const { metrics, overdueInvoices = [], upcomingRenewals = [] } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Operations Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage quotations, process customer subscription renewals, and reconcile outstanding invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/staff/quotations">
            <Button size="sm" variant="secondary">
              <FileText className="w-3.5 h-3.5 mr-1" /> New Quotation
            </Button>
          </Link>
          <Link to="/admin/billing-runs">
            <Button size="sm" variant="brand">
              <Clock className="w-3.5 h-3.5 mr-1" /> Billing Console
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Active Subscriptions</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{metrics?.totalActiveSubscriptions || 0}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Recurring contracts</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Enrolled Customers</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{metrics?.totalCustomers || 0}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Active accounts</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 block">Overdue Invoices</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">{metrics?.overdueCount || 0}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Rs. {metrics?.overdueTotal?.toFixed(2) || '0.00'}</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block">Recovered Revenue</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">Rs. {metrics?.recoveredRevenue?.toFixed(2) || '0.00'}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Dunning recovered</span>
        </Card>
      </div>

      {/* Operational Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Overdue Invoices Requiring Follow-up" subtitle="Actionable payment recovery list">
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No overdue invoices currently pending.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {overdueInvoices.map((inv) => (
                <div key={inv._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block font-mono">{inv.invoiceNumber}</span>
                    <span className="text-slate-500">{inv.customerId?.name}</span>
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

        <Card title="Upcoming Subscription Billing Cycles" subtitle="Next 7 days scheduled recurring renewals">
          {upcomingRenewals.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No subscriptions due in the immediate renewal window.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {upcomingRenewals.map((sub) => (
                <div key={sub._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block font-mono">{sub.subscriptionNumber}</span>
                    <span className="text-slate-500">{sub.customerId?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">Rs. {sub.totalAmount.toFixed(2)}</span>
                    <span className="text-slate-400 text-[11px]">{new Date(sub.nextBillingDate).toLocaleDateString()}</span>
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
