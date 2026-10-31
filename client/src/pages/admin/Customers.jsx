import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { Users, Search, Building2, Phone, Mail, FileText, CheckCircle2, XCircle } from 'lucide-react';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/customers', { params: { search } });
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const toggleCustomerActive = async (cust) => {
    try {
      await api.put(`/users/${cust._id}`, { active: !cust.active });
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage enrolled customer organizations, view tax IDs, addresses, and account statuses
        </p>
      </div>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, company, or email..."
            className="w-full text-sm border-none bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </Card>

      {loading ? (
        <Loader message="Loading customer directory..." />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Customers can self-register via the portal or can be added by staff."
        />
      ) : (
        <Table headers={['Customer & Company', 'Contact Email & Phone', 'Tax ID / GSTIN', 'Joined Date', 'Status', 'Actions']}>
          {customers.map((c) => (
            <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <span className="block font-semibold">{c.name}</span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {c.companyName || 'Individual'}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <div className="space-y-0.5">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {c.email}</span>
                  {c.phone && <span className="flex items-center gap-1 text-slate-400"><Phone className="w-3 h-3" /> {c.phone}</span>}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">
                {c.taxId || 'Not provided'}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(c.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <Badge status={c.active ? 'active' : 'closed'}>
                  {c.active ? 'Active' : 'Deactivated'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    View
                  </Button>
                  <button
                    onClick={() => toggleCustomerActive(c)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      c.active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {c.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer: ${selectedCustomer.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Organization</span>
                <span className="text-sm font-bold text-slate-900">{selectedCustomer.companyName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Tax ID / GSTIN</span>
                <span className="font-mono text-slate-800">{selectedCustomer.taxId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Email</span>
                <span className="text-slate-800">{selectedCustomer.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Phone</span>
                <span className="text-slate-800">{selectedCustomer.phone || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                Billing Address
              </span>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700">
                {selectedCustomer.address?.street ? (
                  <>
                    <p>{selectedCustomer.address.street}</p>
                    <p>{selectedCustomer.address.city}, {selectedCustomer.address.state} - {selectedCustomer.address.zipCode}</p>
                    <p>{selectedCustomer.address.country}</p>
                  </>
                ) : (
                  <p className="text-slate-400">No structured address on file.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
