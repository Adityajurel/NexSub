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
import { Package, Plus, Search, Edit2, Trash2, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    code: '',
    productType: 'Software',
    salesPrice: '',
    costPrice: '',
    description: '',
    variants: []
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/catalog/products', { params: { search } });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      code: '',
      productType: 'Software',
      salesPrice: '',
      costPrice: '',
      description: '',
      variants: [{ name: 'Standard Edition', sku: '', additionalPrice: 0, active: true }]
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      code: p.code,
      productType: p.productType,
      salesPrice: p.salesPrice,
      costPrice: p.costPrice || 0,
      description: p.description || '',
      variants: p.variants?.length ? p.variants : [{ name: 'Standard Edition', sku: '', additionalPrice: 0, active: true }]
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    setForm({
      ...form,
      variants: [...form.variants, { name: '', sku: '', additionalPrice: 0, active: true }]
    });
  };

  const handleRemoveVariant = (index) => {
    const updated = [...form.variants];
    updated.splice(index, 1);
    setForm({ ...form, variants: updated });
  };

  const handleVariantChange = (index, field, val) => {
    const updated = [...form.variants];
    updated[index][field] = val;
    setForm({ ...form, variants: updated });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        salesPrice: Number(form.salesPrice),
        costPrice: Number(form.costPrice) || 0,
        variants: form.variants.map((v) => ({ ...v, additionalPrice: Number(v.additionalPrice) || 0 }))
      };

      if (editingProduct) {
        await api.put(`/catalog/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/catalog/products', payload);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await api.delete(`/catalog/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catalog: Products & Plans</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage product catalog, base sales and cost floors, and variant price additions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/plans"
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
          >
            Switch to Plans &rarr;
          </Link>
          <Button onClick={handleOpenAdd} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> New Product
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or code (e.g. Odoo, Cloud)..."
            className="w-full text-sm border-none bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <Loader message="Loading product catalog..." />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Create your first catalog product with custom variants and price rules."
          actionLabel="Add Product"
          onAction={handleOpenAdd}
        />
      ) : (
        <Table headers={['Product & Code', 'Type', 'Base Sales Price', 'Cost Floor', 'Variants & Additions', 'Status', 'Actions']}>
          {products.map((p) => (
            <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="block font-semibold">{p.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">{p.code}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {p.productType}
                </span>
              </td>
              <td className="px-4 py-3 font-bold text-slate-900">Rs. {p.salesPrice.toFixed(2)}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">Rs. {(p.costPrice || 0).toFixed(2)}</td>
              <td className="px-4 py-3">
                {p.variants?.length ? (
                  <div className="space-y-1">
                    {p.variants.map((v, i) => (
                      <div key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
                        <span className="font-medium">{v.name}:</span>
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">
                          +Rs. {v.additionalPrice} (Total: Rs. {(p.salesPrice + v.additionalPrice).toFixed(2)})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">None</span>
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
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Deactivate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enterprise Odoo ERP"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Product Code / SKU *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="PROD-ODOO"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Product Type
              </label>
              <select
                value={form.productType}
                onChange={(e) => setForm({ ...form, productType: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Software">Software</option>
                <option value="Service">Service</option>
                <option value="Physical">Physical</option>
                <option value="Addon">Addon</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Base Sales Price (Rs.) *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.salesPrice}
                onChange={(e) => setForm({ ...form, salesPrice: e.target.value })}
                placeholder="1000"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cost Price Floor (Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                placeholder="500"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Variants Repeater */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block">
                  Product Variants & Additional Pricing
                </span>
                <span className="text-[11px] text-slate-500">
                  Example: Base ₹1000 + Odoo variant ₹560 = Final ₹1560
                </span>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddVariant}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
              </Button>
            </div>

            <div className="space-y-2">
              {form.variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                    placeholder="Variant Name (e.g. Odoo Connector)"
                    required
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-slate-900"
                  />
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                    placeholder="SKU"
                    className="w-24 rounded border border-slate-300 px-2 py-1 text-slate-900 font-mono"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-bold">+Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={v.additionalPrice}
                      onChange={(e) => handleVariantChange(idx, 'additionalPrice', e.target.value)}
                      placeholder="560"
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-slate-900 font-bold text-emerald-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
