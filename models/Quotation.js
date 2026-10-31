const mongoose = require('mongoose');

const quotationLineSchema = new mongoose.Schema({
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

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuotationTemplate',
      default: null
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required']
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required']
    },
    lines: [quotationLineSchema],
    subtotal: { type: Number, required: true, default: 0 },
    lineDiscountsTotal: { type: Number, default: 0 },
    subscriptionDiscountAmount: { type: Number, default: 0 },
    discountRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscountRule',
      default: null
    },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    validityDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'],
      default: 'Draft'
    },
    notes: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    convertedSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Quotation', quotationSchema);
