import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { PriceExplainerModal } from '../../components/common/PriceExplainerModal';
import { useDemoClock } from '../../context/DemoClockContext';
import { downloadInvoicePdf } from '../../utils/downloadPdf';
import { initiateRazorpayPayment } from '../../utils/paymentHandler';
import {
  Receipt,
  Download,
  Mail,
  DollarSign,
  CheckCircle,
  XCircle,
  Info,
  Search,
  AlertTriangle,
  CreditCard,
  Send,
  Zap,
  Play
} from 'lucide-react';

export const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isOverdueFilter, setIsOverdueFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedExplainer, setSelectedExplainer] = useState(null);
  const { effectiveDate } = useDemoClock();

  // Instant Billing Run State
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [runningBilling, setRunningBilling] = useState(false);
  const [billingResult, setBillingResult] = useState(null);

  // Payment Recording Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    transactionReference: '',
    notes: ''
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {
        search,
        status: statusFilter || undefined,
        isOverdue: isOverdueFilter ? 'true' : undefined
      };
      const res = await api.get('/invoices', { params });
      if (res.data.success) {
        setInvoices(res.data.invoices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, isOverdueFilter, search, effectiveDate]);

  const handleDownloadPDF = (inv) => {
    downloadInvoicePdf(inv._id, inv.invoiceNumber);
  };

  const handleSendEmail = async (id) => {
    try {
      const res = await api.post(`/invoices/${id}/send`);
      alert(res.data.message || 'Invoice emailed successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invoice email');
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.post(`/invoices/${id}/confirm`);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Error confirming invoice');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await api.post(`/invoices/${id}/cancel`);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling invoice');
    }
  };

  const handleRunBilling = async (mode = 'LIVE') => {
    setRunningBilling(true);
    setBillingResult(null);
    try {
      const res = await api.post('/billing/run', { mode });
      setBillingResult(res.data.billingRun);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Billing run failed');
    } finally {
      setRunningBilling(false);
    }
  };

  const openPaymentModal = (inv) => {
    setPaymentModalInvoice(inv);
    setPaymentForm({
      amount: inv.amountDue.toString(),
      paymentMethod: 'UPI',
      transactionReference: `TXN_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      notes: `Payment for ${inv.invoiceNumber}`
    });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (paymentForm.paymentMethod === 'Razorpay') {
      await initiateRazorpayPayment({
        invoice: paymentModalInvoice,
        user: null,
        onSuccess: (data) => {
          setPaymentModalInvoice(null);
          alert('Razorpay payment verified and invoice settled!');
          fetchInvoices();
        },
        onError: (err) => {
          alert(err.message || 'Razorpay payment failed');
        }
      });
      return;
    }

    setRecordingPayment(true);
    try {
      await api.post('/payments/record', {
        invoiceId: paymentModalInvoice._id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference,
        notes: paymentForm.notes
      });
      setPaymentModalInvoice(null);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setRecordingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices & Receivables</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tax invoices generated by the billing engine, dynamic overdue calculations, and payment tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="brand"
            size="sm"
            onClick={() => {
              setBillingResult(null);
              setIsBillingModalOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            Run Billing Engine
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => {
                setStatusFilter('');
                setIsOverdueFilter(false);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                !statusFilter && !isOverdueFilter ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Invoices
            </button>
            <button
              onClick={() => {
                setStatusFilter('Confirmed');
                setIsOverdueFilter(false);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'Confirmed' && !isOverdueFilter ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Confirmed (Unpaid)
            </button>
            <button
              onClick={() => {
                setStatusFilter('Paid');
                setIsOverdueFilter(false);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'Paid' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => {
                setStatusFilter('');
                setIsOverdueFilter(true);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                isOverdueFilter ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Overdue Only
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice #..."
              className="w-full text-xs rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      {loading ? (
        <Loader message="Loading invoices..." />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="Invoices are automatically created during billing runs or quotation conversions."
        />
      ) : (
        <Table headers={['Invoice #', 'Customer & Company', 'Billing Period', 'Total Amount', 'Paid / Due', 'Due Date', 'Status', 'Actions']}>
          {invoices.map((inv) => (
            <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-xs">
                {inv.invoiceNumber}
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="font-semibold text-slate-900 block">{inv.customerId?.name}</span>
                <span className="text-slate-500">{inv.customerId?.companyName}</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(inv.periodStart).toLocaleDateString()} to {new Date(inv.periodEnd).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                Rs. {inv.totalAmount?.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="text-emerald-700 block font-medium">Paid: Rs. {inv.amountPaid?.toFixed(2)}</span>
                <span className={`font-bold ${inv.amountDue > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  Due: Rs. {inv.amountDue?.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="text-slate-900 block">{new Date(inv.dueDate).toLocaleDateString()}</span>
                {inv.isOverdue && (
                  <span className="text-rose-600 font-bold text-[10px] uppercase tracking-wider block animate-pulse">
                    Past Due
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1 items-start">
                  <Badge status={inv.status}>{inv.status}</Badge>
                  {inv.isOverdue && <Badge status="overdue">Overdue</Badge>}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedExplainer(inv)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Price Explainer Formula"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(inv)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Download Tax Invoice PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSendEmail(inv._id)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Email Invoice to Customer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>

                  {inv.status === 'Confirmed' && inv.amountDue > 0 && (
                    <Button
                      size="sm"
                      variant="brand"
                      className="text-xs py-1"
                      onClick={() => openPaymentModal(inv)}
                    >
                      <DollarSign className="w-3 h-3 mr-0.5" /> Pay
                    </Button>
                  )}

                  {inv.status === 'Draft' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs py-1"
                      onClick={() => handleConfirm(inv._id)}
                    >
                      Confirm
                    </Button>
                  )}

                  {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleCancel(inv._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Cancel Invoice"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <Modal
          isOpen={!!paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          title={`Record Payment for ${paymentModalInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{paymentModalInvoice.customerId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invoice Amount:</span>
                <span className="font-semibold text-slate-900">Rs. {paymentModalInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outstanding Balance:</span>
                <span className="font-bold text-rose-600">Rs. {paymentModalInvoice.amountDue.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Amount (Rs.) *
              </label>
              <input
                type="number"
                step="0.01"
                max={paymentModalInvoice.amountDue}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
                className="w-full text-base font-bold rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Supports partial payments. Invoice becomes 'Paid' only when balance reaches 0.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Razorpay">Razorpay</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Transaction Reference *
                </label>
                <input
                  type="text"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  placeholder="TXN_12345678"
                  required
                  className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Internal Notes
              </label>
              <input
                type="text"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Optional notes..."
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setPaymentModalInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={recordingPayment}>
                Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Price Explainer Modal */}
      <PriceExplainerModal
        isOpen={!!selectedExplainer}
        onClose={() => setSelectedExplainer(null)}
        invoiceOrPricing={selectedExplainer}
      />

      {/* Instant Recurring Billing Run Modal */}
      {isBillingModalOpen && (
        <Modal
          isOpen={isBillingModalOpen}
          onClose={() => setIsBillingModalOpen(false)}
          title="⚡ Execute Recurring Billing Engine"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Effective Clock Date:</span>
                <span className="font-bold text-slate-900">
                  {effectiveDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="text-slate-500 text-[11px] leading-relaxed">
                Evaluates all active subscriptions due for renewal on or before this date. Generates idempotent tax invoices, updates billing dates, and maintains audit logs.
              </div>
            </div>

            {billingResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2 text-emerald-900">
                <div className="font-bold flex items-center gap-1.5 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Billing Run Completed
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div>Evaluated: <span className="font-bold">{billingResult.totalSubscriptionsEvaluated}</span></div>
                  <div>Invoices Created: <span className="font-bold text-emerald-700">{billingResult.invoicesCreated}</span></div>
                  <div>Duplicates Skipped: <span className="font-bold text-amber-700">{billingResult.invoicesSkippedDuplicate}</span></div>
                  <div>Failed: <span className="font-bold text-rose-700">{billingResult.subscriptionsFailed}</span></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setIsBillingModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                loading={runningBilling}
                onClick={() => handleRunBilling('DRY_RUN')}
              >
                Preview (Dry Run)
              </Button>
              <Button
                variant="brand"
                loading={runningBilling}
                onClick={() => handleRunBilling('LIVE')}
              >
                <Zap className="w-4 h-4 mr-1 text-amber-300 fill-amber-300" /> Execute Live Billing
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
