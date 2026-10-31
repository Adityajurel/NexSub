import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { CreditCard, Search, ArrowUpRight, DollarSign, Calendar, Building2, CheckCircle2, XCircle } from 'lucide-react';

export const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', {
        params: { status: statusFilter || undefined }
      });
      if (res.data.success) {
        setPayments(res.data.payments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      p.paymentNumber?.toLowerCase().includes(term) ||
      p.transactionReference?.toLowerCase().includes(term) ||
      p.customerId?.name?.toLowerCase().includes(term) ||
      p.invoiceId?.invoiceNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Transactions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconciliation ledger of all UPI, Card, NetBanking, and Razorpay payment transactions
          </p>
        </div>
      </div>

      {/* Filter / Search */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {['', 'Success', 'Pending', 'Failed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === st ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st || 'All Transactions'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference or customer..."
              className="w-full text-xs rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <Loader message="Loading payment transactions..." />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description="Payments recorded against confirmed invoices will appear here."
        />
      ) : (
        <Table headers={['Payment #', 'Customer & Company', 'Invoice Reference', 'Amount Paid', 'Method', 'Transaction Ref', 'Status', 'Date']}>
          {filteredPayments.map((p) => (
            <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-xs">
                {p.paymentNumber}
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="font-semibold text-slate-900 block">{p.customerId?.name}</span>
                <span className="text-slate-500">{p.customerId?.companyName}</span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-sky-600">
                {p.invoiceId?.invoiceNumber || 'Direct'}
              </td>
              <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                Rs. {p.amount.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium">
                  {p.paymentMethod}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">
                {p.transactionReference}
              </td>
              <td className="px-4 py-3">
                <Badge status={p.status}>{p.status}</Badge>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
};
