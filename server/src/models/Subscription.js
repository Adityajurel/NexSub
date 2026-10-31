const mongoose = require('mongoose');

const subscriptionLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: { type: String, required: true },
  variantName: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0 },
  lineDiscountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }
});

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },
    lines: [subscriptionLineSchema],
    billingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
      required: true,
      default: 'Monthly'
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      default: null
    },
    nextBillingDate: {
      type: Date,
      required: true,
      index: true
    },
    lastBilledDate: {
      type: Date,
      default: null
    },
    paymentTerms: {
      type: String,
      default: 'Immediate'
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    discountRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscountRule',
      default: null
    },
    subscriptionDiscountAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Expired', 'Closed'],
      default: 'Active',
      index: true
    },
    pauseDate: {
      type: Date,
      default: null
    },
    resumeDate: {
      type: Date,
      default: null
    },
    autoCloseOnExpiry: {
      type: Boolean,
      default: true
    },
    billingLockUntil: {
      type: Date,
      default: null,
      index: true
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

subscriptionSchema.index({ status: 1, nextBillingDate: 1, billingLockUntil: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
