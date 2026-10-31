import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { UserCheck, Plus, Mail, Phone, Shield, AlertCircle } from 'lucide-react';

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/staff');
      if (res.data.success) {
        setStaffList(res.data.staff);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.password.length <= 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      setError('Password must be longer than 8 characters and contain uppercase, lowercase and special characters.');
      return;
    }

    setError('');
    try {
      await api.post('/auth/create-staff', form);
      setIsModalOpen(false);
      setForm({ name: '', email: '', password: '', phone: '' });
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff account');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Operations Team</h1>
          <p className="text-xs text-slate-500 mt-1">
            Delegate billing operations, quotation management, and invoice handling to authorized staff
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Staff Member
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading operations staff..." />
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No staff accounts found"
          description="Create staff accounts to allow operations and finance team members to log in."
          actionLabel="Add Staff"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <Table headers={['Staff Name', 'Work Email', 'Phone', 'Role Scope', 'Status', 'Created Date']}>
          {staffList.map((s) => (
            <tr key={s._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <span className="block font-semibold">{s.name}</span>
                    <span className="text-[11px] text-slate-400">NexSub Operations</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {s.phone || 'N/A'}
              </td>
              <td className="px-4 py-3">
                <Badge status="staff">Staff Operator</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge status={s.active ? 'active' : 'closed'}>
                  {s.active ? 'Active' : 'Deactivated'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(s.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Authorized Staff Account"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Aditya Jurel"
              required
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Work Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="staff@company.com"
              required
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Temporary Password *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••••••"
              required
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">Must be &gt;8 chars with uppercase, lowercase, and special character.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
