const mongoose = require('mongoose');

const invoiceLineSchema = new mongoose.Schema({
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
  totalAmount: { type: Number, required: true },
  priceSnapshot: {
    basePrice: { type: Number, default: 0 },
    variantPrice: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    formula: { type: String, default: '' }
  }
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    lines: [invoiceLineSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    lineDiscountsTotal: {
      type: Number,
      default: 0
    },
    subscriptionDiscountAmount: {
      type: Number,
      default: 0
    },
    totalDiscount: {
      type: Number,
      default: 0
    },
    totalTax: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    amountDue: {
      type: Number,
      required: true,
      default: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Confirmed', 'Paid', 'Cancelled'],
      default: 'Confirmed',
      index: true
    },
    billingRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingRun',
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Idempotent billing index: Never allow more than one invoice for same subscription & periodStart
invoiceSchema.index({ subscriptionId: 1, periodStart: 1 }, { unique: true });

// Dynamic overdue virtual
invoiceSchema.virtual('isOverdue').get(function () {
  return this.status === 'Confirmed' && this.dueDate < new Date() && this.amountDue > 0;
});

module.exports = mongoose.model('Invoice', invoiceSchema);
