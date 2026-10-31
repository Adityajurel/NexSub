const mongoose = require('mongoose');

const discountRuleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Discount name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['Percentage', 'Fixed'],
      required: true,
      default: 'Percentage'
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    targetType: {
      type: String,
      enum: ['Line', 'Subscription'],
      required: true,
      default: 'Subscription'
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    usageLimit: {
      type: Number,
      default: 0 // 0 means unlimited
    },
    usedCount: {
      type: Number,
      default: 0
    },
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    applicablePlans: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan'
    }],
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DiscountRule', discountRuleSchema);
