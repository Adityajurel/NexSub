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
import { MarginGuardBadge } from '../../components/common/MarginGuardBadge';
import { useDemoClock } from '../../context/DemoClockContext';
import {
  Repeat,
  Plus,
  Search,
  Pause,
  Play,
  RotateCcw,
  XCircle,
  Info,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedExplainer, setSelectedExplainer] = useState(null);
  const [selectedSubDetail, setSelectedSubDetail] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { effectiveDate } = useDemoClock();

  // Create form dependencies
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [form, setForm] = useState({
    customerId: '',
    planId: '',
    lines: [],
    discountRuleId: '',
    paymentTerms: 'Immediate',
    notes: ''
  });
  const [pricingPreview, setPricingPreview] = useState(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions', {
        params: { status: statusFilter || undefined, search }
      });
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
  }, [statusFilter, search, effectiveDate]);

  const handleOpenCreate = async () => {
    try {
      const [cRes, pRes, plRes, dRes] = await Promise.all([
        api.get('/users/customers'),
        api.get('/catalog/products'),
        api.get('/catalog/plans'),
        api.get('/rules/discounts')
      ]);

      setCustomers(cRes.data.customers || []);
      setProducts(pRes.data.products || []);
      setPlans(plRes.data.plans || []);
      setDiscounts(dRes.data.discountRules || []);

      const firstProd = pRes.data.products?.[0];
      setForm({
        customerId: cRes.data.customers?.[0]?._id || '',
        planId: plRes.data.plans?.[0]?._id || '',
        lines: firstProd
          ? [{ productId: firstProd._id, variantName: firstProd.variants?.[0]?.name || '', quantity: 1 }]
          : [],
        discountRuleId: '',
        paymentTerms: 'Immediate',
        notes: ''
      });
      setPricingPreview(null);
      setIsCreateModalOpen(true);
    } catch (err) {
      alert('Failed to load dependency data: ' + err.message);
    }
  };

  const handleLineChange = (idx, field, val) => {
    const updated = [...form.lines];
    updated[idx][field] = val;
    if (field === 'productId') {
      const prod = products.find((p) => p._id === val);
      updated[idx].variantName = prod?.variants?.[0]?.name || '';
    }
    setForm({ ...form, lines: updated });
  };

  useEffect(() => {
    const runPreview = async () => {
      if (!isCreateModalOpen || form.lines.length === 0) return;
      try {
        const res = await api.post('/rules/pricing/preview', {
          lines: form.lines,
          subscriptionDiscountRuleId: form.discountRuleId || null
        });
        if (res.data.success) {
          setPricingPreview(res.data.pricing);
        }
      } catch (e) {
        console.warn(e.message);
      }
    };
    const t = setTimeout(runPreview, 300);
    return () => clearTimeout(t);
  }, [form.lines, form.discountRuleId, isCreateModalOpen]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions', form);
      setIsCreateModalOpen(false);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create subscription');
    }
  };

  const handlePause = async (id) => {
    if (!window.confirm('Pause this subscription? Billing runs will stop until resumed.')) return;
    try {
      await api.post(`/subscriptions/${id}/pause`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error pausing subscription');
    }
  };

  const handleResume = async (id) => {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error resuming subscription');
    }
  };

  const handleRenew = async (id) => {
    try {
      await api.post(`/subscriptions/${id}/renew`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error renewing subscription');
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm('Close this subscription permanently?')) return;
    try {
      await api.post(`/subscriptions/${id}/close`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error closing subscription');
    }
  };

  const statuses = [
    { label: 'All Subscriptions', val: '' },
    { label: 'Active', val: 'Active' },
    { label: 'Paused', val: 'Paused' },
    { label: 'Expired', val: 'Expired' },
    { label: 'Closed', val: 'Closed' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Contracts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time subscriber state machines: Activate, Pause, Resume, Renew, and Close contracts
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Subscription
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {statuses.map((st) => (
              <button
                key={st.val}
                onClick={() => setStatusFilter(st.val)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  statusFilter === st.val
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sub #..."
              className="w-full text-xs rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      {loading ? (
        <Loader message="Loading subscriptions..." />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No subscriptions match this filter"
          description="Create recurring subscriptions or convert from accepted quotations."
          actionLabel="Create Subscription"
          onAction={handleOpenCreate}
        />
      ) : (
        <Table headers={['Sub #', 'Customer & Company', 'Plan Frequency', 'Recurring Amount', 'Next Billing Date', 'Status', 'Lifecycle Actions']}>
          {subscriptions.map((s) => (
            <tr key={s._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-xs">
                {s.subscriptionNumber}
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="font-semibold text-slate-900 block">{s.customerId?.name}</span>
                <span className="text-slate-500">{s.customerId?.companyName}</span>
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {s.planId?.name} ({s.billingFrequency})
                </span>
              </td>
              <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                Rs. {s.totalAmount?.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <span className="font-medium text-slate-900 block">
                  {new Date(s.nextBillingDate).toLocaleDateString()}
                </span>
                {new Date(s.nextBillingDate) <= effectiveDate && s.status === 'Active' && (
                  <span className="text-amber-600 font-semibold text-[10px] uppercase tracking-wider block">
                    Due for Billing
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge status={s.status}>{s.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedExplainer(s)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Price Explainer"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  {s.status === 'Active' && s.planId?.allowPause && (
                    <button
                      onClick={() => handlePause(s._id)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                      title="Pause Subscription"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {s.status === 'Paused' && (
                    <button
                      onClick={() => handleResume(s._id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                      title="Resume Subscription"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {s.planId?.allowRenewal && (
                    <button
                      onClick={() => handleRenew(s._id)}
                      className="p-1.5 text-sky-600 hover:bg-sky-50 rounded"
                      title="Renew Contract"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {s.status !== 'Closed' && (
                    <button
                      onClick={() => handleClose(s._id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      title="Close Subscription"
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

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Subscription Contract"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Organization *
              </label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.companyName || 'Individual'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Billing Plan *
              </label>
              <select
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {plans.map((pl) => (
                  <option key={pl._id} value={pl._id}>
                    {pl.name} ({pl.billingFrequency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Contract Product Line
            </span>
            {form.lines.map((line, idx) => {
              const prod = products.find((p) => p._id === line.productId);
              return (
                <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  <select
                    value={line.productId}
                    onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                    className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-slate-900"
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (Base Rs. {p.salesPrice})
                      </option>
                    ))}
                  </select>

                  {prod?.variants?.length > 0 && (
                    <select
                      value={line.variantName}
                      onChange={(e) => handleLineChange(idx, 'variantName', e.target.value)}
                      className="w-44 rounded border border-slate-300 px-2 py-1.5 text-slate-900"
                    >
                      {prod.variants.map((v, i) => (
                        <option key={i} value={v.name}>
                          {v.name} (+Rs. {v.additionalPrice})
                        </option>
                      ))}
                    </select>
                  )}

                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                    className="w-16 rounded border border-slate-300 px-2 py-1.5 text-slate-900 text-center font-bold"
                  />
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Discount Rule
              </label>
              <select
                value={form.discountRuleId}
                onChange={(e) => setForm({ ...form, discountRuleId: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">No Discount</option>
                {discounts.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} - {d.value} {d.discountType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Terms
              </label>
              <select
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Immediate">Immediate</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
              </select>
            </div>
          </div>

          {pricingPreview && (
            <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 font-semibold">Pricing Engine Breakdown:</span>
                <MarginGuardBadge alert={pricingPreview.marginGuard?.alert} shortfall={pricingPreview.marginGuard?.marginShortfall} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-slate-300">
                <div>Subtotal: Rs. {pricingPreview.subtotal?.toFixed(2)}</div>
                <div>Discount: - Rs. {pricingPreview.totalDiscount?.toFixed(2)}</div>
                <div>GST (18%): Rs. {pricingPreview.totalTax?.toFixed(2)}</div>
              </div>
              <div className="text-right text-base font-bold text-sky-400 pt-1 border-t border-slate-800">
                Recurring Total: Rs. {pricingPreview.grandTotal?.toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Activate Subscription
            </Button>
          </div>
        </form>
      </Modal>

      {/* Price Explainer Modal */}
      <PriceExplainerModal
        isOpen={!!selectedExplainer}
        onClose={() => setSelectedExplainer(null)}
        invoiceOrPricing={selectedExplainer}
      />
    </div>
  );
};
