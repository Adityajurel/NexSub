const mongoose = require('mongoose');

const taxRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Tax code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    rate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: 0,
      max: 100
    },
    isInclusive: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Number,
      default: 1
    },
    appliesToProductTypes: [{
      type: String,
      enum: ['Software', 'Service', 'Physical', 'Addon']
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

module.exports = mongoose.model('TaxRule', taxRuleSchema);
