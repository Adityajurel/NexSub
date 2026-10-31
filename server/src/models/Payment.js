const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Bank Transfer', 'Card', 'Cash', 'Razorpay', 'Other'],
      required: true,
      default: 'UPI'
    },
    transactionReference: {
      type: String,
      required: true,
      trim: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Success', 'Pending', 'Failed'],
      default: 'Success',
      index: true
    },
    razorpayDetails: {
      orderId: { type: String, default: null },
      paymentId: { type: String, default: null },
      signature: { type: String, default: null }
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ transactionReference: 1, invoiceId: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
