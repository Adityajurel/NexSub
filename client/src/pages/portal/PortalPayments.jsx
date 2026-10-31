import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { CreditCard } from 'lucide-react';

export const PortalPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get('/payments');
        if (res.data.success) {
          setPayments(res.data.payments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Receipts & History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical ledger of all payments credited to your account
        </p>
      </div>

      {loading ? (
        <Loader message="Loading payment transactions..." />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments recorded"
          description="Payments made against your subscription invoices will appear here."
        />
      ) : (
        <Table headers={['Payment #', 'Invoice Reference', 'Amount Paid', 'Payment Method', 'Transaction Ref', 'Status', 'Date']}>
          {payments.map((p) => (
            <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-mono font-bold text-slate-900 text-xs">
                {p.paymentNumber}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-sky-600">
                {p.invoiceId?.invoiceNumber || 'Direct'}
              </td>
              <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                Rs. {p.amount.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-800">
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
