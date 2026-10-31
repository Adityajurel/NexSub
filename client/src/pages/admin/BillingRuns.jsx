import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { useDemoClock } from '../../context/DemoClockContext';
import {
  PlayCircle,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';

export const BillingRuns = () => {
  const [runs, setRuns] = useState([]);
  const [upcomingPreview, setUpcomingPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedRunDetails, setSelectedRunDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { effectiveDate, isSimulated } = useDemoClock();

  const fetchHistoryAndPreview = async () => {
    setLoading(true);
    try {
      const [runsRes, prevRes] = await Promise.all([
        api.get('/billing/runs'),
        api.get('/billing/preview')
      ]);

      if (runsRes.data.success) setRuns(runsRes.data.runs);
      if (prevRes.data.success) setUpcomingPreview(prevRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndPreview();
  }, [effectiveDate]);

  const handleRun = async (mode = 'LIVE') => {
    setExecuting(true);
    try {
      const res = await api.post('/billing/run', { mode });
      alert(`${mode} billing run completed! Created: ${res.data.billingRun?.totalCreated}, Skipped: ${res.data.billingRun?.totalSkipped}`);
      fetchHistoryAndPreview();
    } catch (err) {
      alert(err.response?.data?.message || 'Billing run failed');
    } finally {
      setExecuting(false);
    }
  };

  const handleInspect = async (runId) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/billing/runs/${runId}`);
      if (res.data.success) {
        setSelectedRunDetails(res.data);
      }
    } catch (err) {
      alert('Error fetching run details');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing Run Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Idempotent batch recurring invoice generator with atomic lock lease claiming and duplicate protection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleRun('DRY_RUN')}
            loading={executing}
          >
            <Eye className="w-3.5 h-3.5 mr-1 text-sky-600" /> Dry Run Preview
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleRun('LIVE')}
            loading={executing}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <PlayCircle className="w-3.5 h-3.5 mr-1" /> Execute Live Billing Run
          </Button>
        </div>
      </div>

      {/* Engine Status Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Idempotent Billing Engine</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-sm font-medium text-slate-200 mt-0.5">
              Guaranteed single invoice per subscription cycle via unique compound index (subscription + periodStart)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
          <div>
            <span className="text-slate-500 block text-[11px]">As-of Date</span>
            <span className="font-bold text-white">
              {new Date(effectiveDate).toLocaleDateString()} {isSimulated ? '(Simulated)' : ''}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Due for Billing</span>
            <span className="font-bold text-amber-400 text-base">{upcomingPreview?.totalDue || 0}</span>
          </div>
        </div>
      </div>

      {/* Upcoming Subscriptions Due for Billing */}
      {upcomingPreview?.subscriptions?.length > 0 && (
        <Card
          title={`Subscriptions Due for Invoicing (${upcomingPreview.totalDue})`}
          subtitle={`Subscriptions whose next billing date is on or before ${new Date(effectiveDate).toLocaleDateString()}`}
        >
          <div className="divide-y divide-slate-100 text-xs">
            {upcomingPreview.subscriptions.slice(0, 5).map((sub) => (
              <div key={sub._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block font-mono">{sub.subscriptionNumber}</span>
                  <span className="text-slate-500">{sub.customerId?.name} ({sub.customerId?.companyName})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">Rs. {sub.totalAmount.toFixed(2)}</span>
                  <span className="text-slate-500">{sub.planId?.name} ({sub.billingFrequency})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Historical Billing Runs */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Billing Execution Logs</h2>
        {loading ? (
          <Loader message="Loading execution history..." />
        ) : runs.length === 0 ? (
          <EmptyState
            icon={PlayCircle}
            title="No billing runs executed yet"
            description="Trigger a manual run or wait for the automated 5-minute cron scheduler."
            actionLabel="Run Billing Now"
            onAction={() => handleRun('LIVE')}
          />
        ) : (
          <Table headers={['Run Number', 'Execution Date', 'Mode', 'Evaluated', 'Created', 'Skipped (Duplicate)', 'Failed', 'Total Invoiced', 'Duration', 'Actions']}>
            {runs.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-xs">
                  {r.runNumber}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {new Date(r.runDate || r.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Badge status={r.mode === 'LIVE' ? 'live' : 'dry_run'}>
                    {r.mode}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                  {r.totalEvaluated}
                </td>
                <td className="px-4 py-3 text-xs font-bold text-emerald-600">
                  {r.totalCreated}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-slate-500">
                  {r.totalSkipped}
                </td>
                <td className="px-4 py-3 text-xs font-bold text-rose-600">
                  {r.totalFailed}
                </td>
                <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                  Rs. {r.totalAmountBilled?.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {r.durationMs}ms
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs py-1"
                    onClick={() => handleInspect(r._id)}
                  >
                    <Eye className="w-3 h-3 mr-1" /> Inspect
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Inspect Items Modal */}
      {selectedRunDetails && (
        <Modal
          isOpen={!!selectedRunDetails}
          onClose={() => setSelectedRunDetails(null)}
          title={`Billing Run Details: ${selectedRunDetails.billingRun?.runNumber}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-center">
              <div>
                <span className="text-slate-400 block font-semibold">Mode</span>
                <span className="font-bold text-slate-900">{selectedRunDetails.billingRun?.mode}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Created Invoices</span>
                <span className="font-bold text-emerald-600">{selectedRunDetails.billingRun?.totalCreated}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Skipped Duplicates</span>
                <span className="font-bold text-slate-700">{selectedRunDetails.billingRun?.totalSkipped}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Total Amount Billed</span>
                <span className="font-bold text-slate-900">Rs. {selectedRunDetails.billingRun?.totalAmountBilled?.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                Evaluated Subscriptions Log ({selectedRunDetails.items?.length || 0})
              </span>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white text-xs">
                {selectedRunDetails.items?.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No candidate subscriptions in this run.</div>
                ) : (
                  selectedRunDetails.items.map((item, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 font-mono">
                            {item.subscriptionId?.subscriptionNumber || 'Subscription'}
                          </span>
                          <Badge status={item.status}>{item.status}</Badge>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {item.customerId?.name} ({item.customerId?.companyName}) - {item.reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          Rs. {item.amount?.toFixed(2)}
                        </span>
                        {item.invoiceNumber && (
                          <span className="font-mono text-sky-600 text-[11px]">{item.invoiceNumber}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedRunDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
