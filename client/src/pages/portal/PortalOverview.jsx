import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Loader } from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { useDemoClock } from '../../context/DemoClockContext';
import { downloadInvoicePdf } from '../../utils/downloadPdf';
import {
  Repeat,
  Receipt,
  CreditCard,
  Download,
  AlertTriangle,
  Pause,
  Play,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';

export const PortalOverview = () => {
  const { user } = useAuth();
  const { effectiveDate } = useDemoClock();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/invoices')
      ]);

      if (subRes.data.success) setSubscriptions(subRes.data.subscriptions);
      if (invRes.data.success) setInvoices(invRes.data.invoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [effectiveDate]);

  if (loading) return <Loader message="Loading your customer portal..." />;

  const activeSubs = subscriptions.filter((s) => s.status === 'Active');
  const unpaidInvoices = invoices.filter((i) => i.status === 'Confirmed' && i.amountDue > 0);
  const totalDue = unpaidInvoices.reduce((sum, i) => sum + i.amountDue, 0);

  const handlePause = async (id) => {
    if (!window.confirm('Pause your subscription? Invoicing will be paused until resumed.')) return;
    try {
      await api.post(`/subscriptions/${id}/pause`);
      fetchPortalData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error pausing subscription');
    }
  };

  const handleResume = async (id) => {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      fetchPortalData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error resuming subscription');
    }
  };

  const handleDownloadPDF = (inv) => {
    downloadInvoicePdf(inv._id, inv.invoiceNumber);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-sky-400 font-semibold text-xs uppercase tracking-wider block">Customer Self-Service Portal</span>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Welcome, {user?.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {user?.companyName ? `${user.companyName} • ` : ''}Manage recurring subscriptions, view invoices, and settle balances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status="customer">Protected Customer Session</Badge>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Active Subscriptions</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{activeSubs.length}</span>
          <span className="text-xs text-slate-400 mt-1 block">Recurring billing enabled</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Outstanding Balance</span>
          <span className={`text-2xl font-bold mt-1 block ${totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            Rs. {totalDue.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {unpaidInvoices.length} invoice(s) pending payment
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Invoices</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{invoices.length}</span>
          <span className="text-xs text-slate-400 mt-1 block">PDF statements available</span>
        </Card>
      </div>

      {/* Active Subscriptions Card */}
      <Card title="My Active Subscriptions" subtitle="Manage your recurring software plans and add-on services">
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            You do not currently have any active subscriptions.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {subscriptions.map((s) => (
              <div key={s._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono">{s.subscriptionNumber}</span>
                    <Badge status={s.status}>{s.status}</Badge>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                      {s.planId?.name} ({s.billingFrequency})
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">
                    Next billing date: <strong>{new Date(s.nextBillingDate).toLocaleDateString()}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-base font-bold text-slate-900">
                    Rs. {s.totalAmount?.toFixed(2)}
                  </span>
                  {s.status === 'Active' && s.planId?.allowPause && (
                    <Button size="sm" variant="secondary" onClick={() => handlePause(s._id)}>
                      <Pause className="w-3 h-3 mr-1 text-amber-600" /> Pause
                    </Button>
                  )}
                  {s.status === 'Paused' && (
                    <Button size="sm" variant="brand" onClick={() => handleResume(s._id)}>
                      <Play className="w-3 h-3 mr-1" /> Resume
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Invoices Card */}
      <Card title="Recent Invoices" subtitle="Download tax invoice receipts or view payment details">
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No invoices generated yet.
          </div>
        ) : (
          <Table headers={['Invoice #', 'Billing Period', 'Total Amount', 'Balance Due', 'Due Date', 'Status', 'Actions']}>
            {invoices.slice(0, 5).map((inv) => (
              <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors text-xs">
                <td className="px-4 py-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(inv.periodStart).toLocaleDateString()} to {new Date(inv.periodEnd).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-bold text-slate-900">Rs. {inv.totalAmount?.toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold text-rose-600">Rs. {inv.amountDue?.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Badge status={inv.status}>{inv.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" onClick={() => handleDownloadPDF(inv)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
};
