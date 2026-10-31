import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Repeat, Pause, Play, XCircle, Info, Calendar } from 'lucide-react';

export const PortalSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions');
      if (res.data.success) {
        setSubscriptions(res.data.subscriptions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handlePause = async (id) => {
    if (!window.confirm('Pause your subscription?')) return;
    try {
      await api.post(`/subscriptions/${id}/pause`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error pausing');
    }
  };

  const handleResume = async (id) => {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error resuming');
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm('Request cancellation of this subscription?')) return;
    try {
      await api.post(`/subscriptions/${id}/close`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error closing subscription');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Subscriptions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review active contracts, recurring plan details, and request self-service pauses or cancellations
        </p>
      </div>

      {loading ? (
        <Loader message="Loading your subscriptions..." />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No active subscriptions found"
          description="You do not currently have any active software subscriptions."
        />
      ) : (
        <Table headers={['Subscription #', 'Plan Frequency', 'Items / Variants', 'Recurring Amount', 'Next Billing Date', 'Status', 'Actions']}>
          {subscriptions.map((s) => (
            <tr key={s._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-mono font-bold text-slate-900 text-xs">
                {s.subscriptionNumber}
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-medium border border-sky-200">
                  {s.planId?.name} ({s.billingFrequency})
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-700">
                {s.lines?.map((l, i) => (
                  <div key={i}>
                    {l.productName} {l.variantName ? `(${l.variantName})` : ''} x {l.quantity}
                  </div>
                ))}
              </td>
              <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                Rs. {s.totalAmount?.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {new Date(s.nextBillingDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <Badge status={s.status}>{s.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {s.status === 'Active' && s.planId?.allowPause && (
                    <Button size="sm" variant="secondary" className="text-xs py-1" onClick={() => handlePause(s._id)}>
                      <Pause className="w-3 h-3 mr-1 text-amber-600" /> Pause
                    </Button>
                  )}
                  {s.status === 'Paused' && (
                    <Button size="sm" variant="brand" className="text-xs py-1" onClick={() => handleResume(s._id)}>
                      <Play className="w-3 h-3 mr-1" /> Resume
                    </Button>
                  )}
                  {s.status !== 'Closed' && s.planId?.allowEarlyClosure && (
                    <button
                      onClick={() => handleClose(s._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Cancel Subscription"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
};
