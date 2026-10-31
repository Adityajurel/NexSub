import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Percent, Plus, Edit2, Trash2 } from 'lucide-react';

export const Taxes = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    rate: '',
    isInclusive: false,
    priority: 1
  });

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rules/taxes');
      if (res.data.success) {
        setTaxes(res.data.taxRules);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rules/taxes', {
        ...form,
        rate: Number(form.rate),
        priority: Number(form.priority) || 1
      });
      setIsModalOpen(false);
      setForm({ name: '', code: '', rate: '', isInclusive: false, priority: 1 });
      fetchTaxes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save tax rule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this tax rule?')) return;
    try {
      await api.delete(`/rules/taxes/${id}`);
      fetchTaxes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting tax rule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tax Rules & Rates</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure statutory taxes (GST, VAT, Cess) applied automatically during quotation and invoice calculation
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Tax Rule
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading tax rules..." />
      ) : taxes.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="No tax rules configured"
          description="Create standard tax rules such as GST 18%."
          actionLabel="Add Tax Rule"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <Table headers={['Tax Name & Code', 'Rate (%)', 'Calculation Mode', 'Priority', 'Status', 'Actions']}>
          {taxes.map((t) => (
            <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="block font-semibold">{t.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">{t.code}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                {t.rate}%
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {t.isInclusive ? 'Inclusive' : 'Exclusive (Standard)'}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700 text-xs">
                Level {t.priority || 1}
              </td>
              <td className="px-4 py-3">
                <Badge status={t.active ? 'active' : 'closed'}>{t.active ? 'Active' : 'Inactive'}</Badge>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(t._id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  title="Deactivate"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Tax Rule">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tax Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Goods & Services Tax (GST 18%)"
              required
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tax Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="GST18"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Rate (%) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="18"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Tax Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
