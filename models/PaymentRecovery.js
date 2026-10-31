const mongoose = require('mongoose');

const retryLogSchema = new mongoose.Schema({
  attemptDate: { type: Date, default: Date.now },
  outcome: { type: String, enum: ['Success', 'Failed'], required: true },
  message: { type: String, default: '' },
  notificationSent: { type: Boolean, default: false }
});

const paymentRecoverySchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      unique: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    attemptCount: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    nextRetryDate: {
      type: Date,
      required: true
    },
    lastAttemptDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['Pending', 'In_Progress', 'Recovered', 'Abandoned'],
      default: 'Pending',
      index: true
    },
    recoveredAmount: {
      type: Number,
      default: 0
    },
    recoveredAt: {
      type: Date,
      default: null
    },
    retryLogs: [retryLogSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PaymentRecovery', paymentRecoverySchema);
