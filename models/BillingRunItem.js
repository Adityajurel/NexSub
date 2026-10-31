const mongoose = require('mongoose');

const billingRunItemSchema = new mongoose.Schema(
  {
    billingRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingRun',
      required: true,
      index: true
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
      required: true
    },
    status: {
      type: String,
      enum: ['CREATED', 'SKIPPED_DUPLICATE', 'FAILED'],
      required: true
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null
    },
    invoiceNumber: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      default: 0
    },
    periodStart: {
      type: Date,
      default: null
    },
    periodEnd: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      default: ''
    },
    retryable: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BillingRunItem', billingRunItemSchema);
