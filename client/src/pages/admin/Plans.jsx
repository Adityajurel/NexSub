import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Table } from '../../components/common/Table';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Calendar, Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';

export const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    code: '',
    billingFrequency: 'Monthly',
    minimumQuantity: 1,
    allowPause: true,
    allowEarlyClosure: true,
    allowRenewal: true,
    autoCloseOnExpiry: true,
    description: ''
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/catalog/plans');
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      code: '',
      billingFrequency: 'Monthly',
      minimumQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      autoCloseOnExpiry: true,
      description: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      code: plan.code,
      billingFrequency: plan.billingFrequency,
      minimumQuantity: plan.minimumQuantity || 1,
      allowPause: plan.allowPause ?? true,
      allowEarlyClosure: plan.allowEarlyClosure ?? true,
      allowRenewal: plan.allowRenewal ?? true,
      autoCloseOnExpiry: plan.autoClosureRules?.autoCloseOnExpiry ?? true,
      description: plan.description || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        minimumQuantity: Number(form.minimumQuantity) || 1,
        autoClosureRules: { autoCloseOnExpiry: form.autoCloseOnExpiry, gracePeriodDays: 0 }
      };

      if (editingPlan) {
        await api.put(`/catalog/plans/${editingPlan._id}`, payload);
      } else {
        await api.post('/catalog/plans', payload);
      }

      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this plan?')) return;
    try {
      await api.delete(`/catalog/plans/${id}`);
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing Plans</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure recurring intervals (daily/weekly/monthly/yearly), lifecycle rules, and pause permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/products"
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
          >
            &larr; Switch to Products
          </Link>
          <Button onClick={handleOpenAdd} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> New Plan
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading subscription plans..." />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No billing plans found"
          description="Create recurring billing plans with automated closure and pause policies."
          actionLabel="Create Plan"
          onAction={handleOpenAdd}
        />
      ) : (
        <Table headers={['Plan Name & Code', 'Frequency', 'Min Qty', 'Allow Pause', 'Allow Early Close', 'Allow Renewal', 'Status', 'Actions']}>
          {plans.map((p) => (
            <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="block font-semibold">{p.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">{p.code}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  {p.billingFrequency}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-800">{p.minimumQuantity || 1}</td>
              <td className="px-4 py-3 text-xs">
                {p.allowPause ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-medium"><Check className="w-3.5 h-3.5" /> Yes</span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1"><X className="w-3.5 h-3.5" /> No</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs">
                {p.allowEarlyClosure ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-medium"><Check className="w-3.5 h-3.5" /> Yes</span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1"><X className="w-3.5 h-3.5" /> No</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs">
                {p.allowRenewal ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-medium"><Check className="w-3.5 h-3.5" /> Yes</span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1"><X className="w-3.5 h-3.5" /> No</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge status={p.active ? 'active' : 'closed'}>{p.active ? 'Active' : 'Inactive'}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Billing Plan' : 'Create Billing Plan'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Standard Monthly Plan"
              required
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Plan Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="PLAN-MONTHLY"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Billing Frequency *
              </label>
              <select
                value={form.billingFrequency}
                onChange={(e) => setForm({ ...form, billingFrequency: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Minimum Quantity
              </label>
              <input
                type="number"
                min="1"
                value={form.minimumQuantity}
                onChange={(e) => setForm({ ...form, minimumQuantity: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pb-2">
                <input
                  type="checkbox"
                  checked={form.allowPause}
                  onChange={(e) => setForm({ ...form, allowPause: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
                Allow Subscriptions to Pause
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.allowEarlyClosure}
                onChange={(e) => setForm({ ...form, allowEarlyClosure: e.target.checked })}
                className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              Allow Early Closure
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.allowRenewal}
                onChange={(e) => setForm({ ...form, allowRenewal: e.target.checked })}
                className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              Allow Contract Renewal
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
