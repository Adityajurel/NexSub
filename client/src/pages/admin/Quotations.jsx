import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { MarginGuardBadge } from '../../components/common/MarginGuardBadge';
import { PriceExplainerModal } from '../../components/common/PriceExplainerModal';
import { downloadQuotationPdf } from '../../utils/downloadPdf';
import { FileText, Plus, Download, ArrowRight, CheckCircle, Eye, Info, X } from 'lucide-react';

export const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExplainer, setSelectedExplainer] = useState(null);

  // Form dependencies
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  const [form, setForm] = useState({
    customerId: '',
    planId: '',
    validityDays: 30,
    discountRuleId: '',
    lines: [],
    notes: '',
    termsAndConditions: 'Standard 30-day quote validity. 18% GST applicable.'
  });

  const [pricingPreview, setPricingPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      if (res.data.success) {
        setQuotations(res.data.quotations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

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
        validityDays: 30,
        discountRuleId: '',
        lines: firstProd
          ? [{ productId: firstProd._id, variantName: firstProd.variants?.[0]?.name || '', quantity: 1 }]
          : [],
        notes: '',
        termsAndConditions: 'Payment due upon confirmation. Standard subscription terms apply.'
      });
      setPricingPreview(null);
      setIsModalOpen(true);
    } catch (err) {
      alert('Error fetching form data: ' + err.message);
    }
  };

  const handleAddLine = () => {
    if (!products.length) return;
    const prod = products[0];
    setForm({
      ...form,
      lines: [...form.lines, { productId: prod._id, variantName: prod.variants?.[0]?.name || '', quantity: 1 }]
    });
  };

  const handleRemoveLine = (idx) => {
    const updated = [...form.lines];
    updated.splice(idx, 1);
    setForm({ ...form, lines: updated });
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

  // Preview pricing whenever lines or discount change
  useEffect(() => {
    const runPreview = async () => {
      if (!isModalOpen || form.lines.length === 0) return;
      setPreviewLoading(true);
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
      } finally {
        setPreviewLoading(false);
      }
    };

    const timer = setTimeout(runPreview, 300);
    return () => clearTimeout(timer);
  }, [form.lines, form.discountRuleId, isModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/quotations', form);
      setIsModalOpen(false);
      fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create quotation');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/quotations/${id}/status`, { status });
      fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleConvert = async (id) => {
    if (!window.confirm('Convert this confirmed quotation into an active subscription?')) return;
    try {
      const res = await api.post(`/quotations/${id}/convert`);
      alert(res.data.message);
      fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to convert quotation');
    }
  };

  const downloadPDF = (q) => {
    downloadQuotationPdf(q._id, q.quotationNumber);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations & Proposals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build formal quotes, preview pricing breakdowns, generate downloadable PDFs, and convert to active subscriptions
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Create Quotation
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading quotation proposals..." />
      ) : quotations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotations created"
          description="Draft customer proposals with automated tax and discount pricing."
          actionLabel="Create Quotation"
          onAction={handleOpenCreate}
        />
      ) : (
        <Table headers={['Quote #', 'Customer & Company', 'Plan Frequency', 'Grand Total', 'Valid Until', 'Status', 'Actions']}>
          {quotations.map((q) => (
            <tr key={q._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-xs">
                {q.quotationNumber}
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="font-semibold text-slate-900 block">{q.customerId?.name}</span>
                <span className="text-slate-500">{q.customerId?.companyName}</span>
              </td>
              <td className="px-4 py-3 text-xs">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {q.planId?.name}
                </span>
              </td>
              <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                Rs. {q.grandTotal.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(q.validityDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <Badge status={q.status}>{q.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedExplainer(q)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Price Explainer"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => downloadPDF(q)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Download PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {q.status === 'Quotation' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs py-1"
                      onClick={() => handleStatusChange(q._id, 'Confirmed')}
                    >
                      Confirm
                    </Button>
                  )}
                  {q.status === 'Confirmed' && (
                    <Button
                      size="sm"
                      variant="brand"
                      className="text-xs py-1"
                      onClick={() => handleConvert(q._id)}
                    >
                      Convert <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Create Quote Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Customer Quotation"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assign to Customer *
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
                Subscription Plan *
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

          {/* Line items repeater */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Products & Variants in Quotation
              </span>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddLine}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Line Item
              </Button>
            </div>

            <div className="space-y-2">
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
                        className="w-40 rounded border border-slate-300 px-2 py-1.5 text-slate-900"
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

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Discount Coupon / Rule
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
                Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                value={form.validityDays}
                onChange={(e) => setForm({ ...form, validityDays: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Real-time Pricing Preview & Margin Guard */}
          {pricingPreview && (
            <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 font-semibold">Pricing Engine Live Calculation:</span>
                <MarginGuardBadge alert={pricingPreview.marginGuard?.alert} shortfall={pricingPreview.marginGuard?.marginShortfall} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-slate-300">
                <div>Subtotal: Rs. {pricingPreview.subtotal?.toFixed(2)}</div>
                <div>Discount: - Rs. {pricingPreview.totalDiscount?.toFixed(2)}</div>
                <div>GST (18%): Rs. {pricingPreview.totalTax?.toFixed(2)}</div>
              </div>
              <div className="text-right text-base font-bold text-sky-400 pt-1 border-t border-slate-800">
                Grand Total: Rs. {pricingPreview.grandTotal?.toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Generate Quotation
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
