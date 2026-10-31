import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { downloadInvoicePdf } from '../../utils/downloadPdf';
import { initiateRazorpayPayment } from '../../utils/paymentHandler';
import { Receipt, Download, CreditCard, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';

export const PortalInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payInvoice, setPayInvoice] = useState(null);
  const [payMethod, setPayMethod] = useState('Razorpay');
  const [payLoading, setPayLoading] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
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
  }, []);

  const handleDownloadPDF = (inv) => {
    downloadInvoicePdf(inv._id, inv.invoiceNumber);
  };

  const handleOnlinePay = async (e) => {
    e.preventDefault();
    if (!payInvoice) return;
    setPayLoading(true);

    if (payMethod === 'Razorpay') {
      await initiateRazorpayPayment({
        invoice: payInvoice,
        user,
        onSuccess: (data) => {
          setPayLoading(false);
          setPayInvoice(null);
          alert('Payment successful! Your invoice has been settled.');
          fetchInvoices();
        },
        onError: (err) => {
          setPayLoading(false);
          alert(err.message || 'Payment processing failed');
        }
      });
      return;
    }

    try {
      const txnRef = `PAY_${payMethod.toUpperCase()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await api.post('/payments/record', {
        invoiceId: payInvoice._id,
        amount: payInvoice.amountDue,
        paymentMethod: payMethod,
        transactionReference: txnRef,
        notes: `Customer online settlement via ${payMethod}`
      });
      alert('Payment successful! Your invoice is now settled.');
      setPayInvoice(null);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Invoices & Statements</h1>
        <p className="text-xs text-slate-500 mt-1">
          Download PDF tax invoices, review billing period breakdowns, and pay outstanding amounts
        </p>
      </div>

      {loading ? (
        <Loader message="Loading your invoices..." />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="Your subscription statements will appear here upon recurring invoice generation."
        />
      ) : (
        <Table headers={['Invoice #', 'Billing Period', 'Total Amount', 'Balance Due', 'Due Date', 'Status', 'Actions']}>
          {invoices.map((inv) => (
            <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-mono font-bold text-slate-900 text-xs">
                {inv.invoiceNumber}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(inv.periodStart).toLocaleDateString()} to {new Date(inv.periodEnd).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                Rs. {inv.totalAmount?.toFixed(2)}
              </td>
              <td className="px-4 py-3 font-bold text-xs text-rose-600">
                Rs. {inv.amountDue?.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {new Date(inv.dueDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1 items-start">
                  <Badge status={inv.status}>{inv.status}</Badge>
                  {inv.isOverdue && <Badge status="overdue">Overdue</Badge>}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleDownloadPDF(inv)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                  {inv.status === 'Confirmed' && inv.amountDue > 0 && (
                    <Button size="sm" variant="brand" onClick={() => setPayInvoice(inv)}>
                      <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay Now
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Pay Online Modal */}
      {payInvoice && (
        <Modal
          isOpen={!!payInvoice}
          onClose={() => setPayInvoice(null)}
          title={`Pay Invoice ${payInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleOnlinePay} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Amount:</span>
                <span className="font-semibold text-slate-900">Rs. {payInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-900">Payable Amount:</span>
                <span className="text-emerald-600">Rs. {payInvoice.amountDue.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['UPI', 'Card', 'Razorpay'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className={`p-3 rounded-lg border font-semibold transition-all ${
                      payMethod === m
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" loading={payLoading} className="w-full py-2.5">
              Confirm & Pay Rs. {payInvoice.amountDue.toFixed(2)}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};
