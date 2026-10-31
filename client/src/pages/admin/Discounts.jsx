import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Tag, Plus, Trash2, Calendar, ShieldCheck, CheckCircle } from 'lucide-react';

export const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    discountType: 'Percentage',
    value: '',
    targetType: 'Subscription',
    minPurchaseAmount: '',
    usageLimit: 0,
    description: ''
  });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rules/discounts');
      if (res.data.success) {
        setDiscounts(res.data.discountRules);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rules/discounts', {
        ...form,
        value: Number(form.value),
        minPurchaseAmount: Number(form.minPurchaseAmount) || 0,
        usageLimit: Number(form.usageLimit) || 0
      });
      setIsModalOpen(false);
      setForm({
        name: '',
        code: '',
        discountType: 'Percentage',
        value: '',
        targetType: 'Subscription',
        minPurchaseAmount: '',
        usageLimit: 0,
        description: ''
      });
      fetchDiscounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save discount rule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this discount code?')) return;
    try {
      await api.delete(`/rules/discounts/${id}`);
      fetchDiscounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting discount rule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discount Coupons & Promotions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure percentage or fixed discount rules with minimum purchase requirements and usage caps
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Create Coupon
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading discount promotions..." />
      ) : discounts.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No promotional discounts"
          description="Create discount coupons to incentivize customer subscriptions."
          actionLabel="Create Coupon"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <Table headers={['Coupon Code', 'Discount Name', 'Value / Type', 'Min Purchase', 'Usage / Limit', 'Target Scope', 'Status', 'Actions']}>
          {discounts.map((d) => {
            const usagePercent = d.usageLimit > 0 ? Math.min(100, Math.round((d.usedCount / d.usageLimit) * 100)) : 0;
            return (
              <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-sky-700 text-xs">
                  <span className="bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                    {d.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                  {d.name}
                </td>
                <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                  {d.discountType === 'Percentage' ? `${d.value}% Off` : `Rs. ${d.value} Flat`}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {d.minPurchaseAmount > 0 ? `Rs. ${d.minPurchaseAmount}` : 'None'}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                      <span>{d.usedCount} used</span>
                      <span>{d.usageLimit > 0 ? `${d.usageLimit} max` : 'Unlimited'}</span>
                    </div>
                    {d.usageLimit > 0 && (
                      <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${usagePercent >= 100 ? 'bg-rose-500' : 'bg-sky-500'}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                    {d.targetType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge status={d.active ? 'active' : 'closed'}>{d.active ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(d._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Deactivate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Discount Coupon">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="WELCOME20"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coupon Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="New Customer Welcome (20% Off)"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Discount Type *
              </label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed Amount (Rs.)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.discountType === 'Percentage' ? '20' : '500'}
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Minimum Purchase Amount (Rs.)
              </label>
              <input
                type="number"
                min="0"
                value={form.minPurchaseAmount}
                onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
                placeholder="1000"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Usage Limit (0 for Unlimited)
              </label>
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="100"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Discount Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
