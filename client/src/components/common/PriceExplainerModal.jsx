import React from 'react';
import { Modal } from './Modal';
import { Info, CheckCircle2 } from 'lucide-react';

export const PriceExplainerModal = ({ isOpen, onClose, invoiceOrPricing }) => {
  if (!invoiceOrPricing) return null;

  const lines = invoiceOrPricing.lines || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Price Explainer & Calculation Breakdown" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600">
            This breakdown reveals how every rupee was computed according to the centralized NexSub Pricing Engine: Base Price → Variant Price → Quantity Multiplier → Line Discount → Subscription Discount → Tax Application.
          </p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {lines.map((line, idx) => (
            <div key={idx} className="p-4 bg-white hover:bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-slate-900">
                  {line.productName} {line.variantName ? `(${line.variantName})` : ''}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  Rs. {line.totalAmount?.toFixed ? line.totalAmount.toFixed(2) : line.totalAmount}
                </span>
              </div>

              {/* Explainer snapshot formula */}
              {line.priceSnapshot?.formula ? (
                <div className="bg-slate-900 text-sky-400 font-mono text-xs p-2.5 rounded border border-slate-800 break-words mb-2">
                  {line.priceSnapshot.formula}
                </div>
              ) : null}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 mt-2">
                <div>
                  <span className="text-slate-400 block">Unit Price:</span>
                  Rs. {line.unitPrice?.toFixed(2)}
                </div>
                <div>
                  <span className="text-slate-400 block">Quantity:</span>
                  {line.quantity}
                </div>
                <div>
                  <span className="text-slate-400 block">Line Discount:</span>
                  - Rs. {line.lineDiscountAmount?.toFixed(2) || '0.00'}
                </div>
                <div>
                  <span className="text-slate-400 block">Tax Rate:</span>
                  {line.taxRate}% (Rs. {line.taxAmount?.toFixed(2)})
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Summary */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>Rs. {invoiceOrPricing.subtotal?.toFixed(2)}</span>
          </div>
          {invoiceOrPricing.totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Total Discounts Applied:</span>
              <span>- Rs. {invoiceOrPricing.totalDiscount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Taxes (GST 18%):</span>
            <span>Rs. {(invoiceOrPricing.totalTax || invoiceOrPricing.taxAmount)?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Payable Grand Total:</span>
            <span>Rs. {(invoiceOrPricing.totalAmount || invoiceOrPricing.grandTotal)?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
