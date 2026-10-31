const mongoose = require('mongoose');

const templateLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantName: {
    type: String,
    default: ''
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  unitPrice: {
    type: Number,
    default: 0
  }
});

const quotationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    lines: [templateLineSchema],
    defaultValidityDays: {
      type: Number,
      default: 30,
      min: 1
    },
    termsAndConditions: {
      type: String,
      default: 'Payment due upon confirmation. Standard subscription terms apply.'
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

module.exports = mongoose.model('QuotationTemplate', quotationTemplateSchema);
