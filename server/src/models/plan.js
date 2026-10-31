const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Plan code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    billingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
      required: true,
      default: 'Monthly'
    },
    minimumQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    availabilityStartDate: {
      type: Date,
      default: null
    },
    availabilityEndDate: {
      type: Date,
      default: null
    },
    allowPause: {
      type: Boolean,
      default: true
    },
    allowEarlyClosure: {
      type: Boolean,
      default: true
    },
    allowRenewal: {
      type: Boolean,
      default: true
    },
    autoClosureRules: {
      autoCloseOnExpiry: {
        type: Boolean,
        default: true
      },
      gracePeriodDays: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Plan', planSchema);
