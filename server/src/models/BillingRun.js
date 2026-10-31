const mongoose = require('mongoose');

const billingRunSchema = new mongoose.Schema(
  {
    runNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    runDate: {
      type: Date,
      default: Date.now
    },
    simulationDate: {
      type: Date,
      default: null
    },
    mode: {
      type: String,
      enum: ['LIVE', 'DRY_RUN'],
      default: 'LIVE'
    },
    triggeredBy: {
      type: String,
      enum: ['CRON', 'MANUAL'],
      default: 'MANUAL'
    },
    status: {
      type: String,
      enum: ['RUNNING', 'COMPLETED', 'FAILED'],
      default: 'RUNNING',
      index: true
    },
    totalEvaluated: {
      type: Number,
      default: 0
    },
    totalCreated: {
      type: Number,
      default: 0
    },
    totalSkipped: {
      type: Number,
      default: 0
    },
    totalFailed: {
      type: Number,
      default: 0
    },
    totalAmountBilled: {
      type: Number,
      default: 0
    },
    durationMs: {
      type: Number,
      default: 0
    },
    error: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BillingRun', billingRunSchema);
