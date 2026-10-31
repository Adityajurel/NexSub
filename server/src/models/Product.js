const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    trim: true,
    default: ''
  },
  additionalPrice: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  }
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Product code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    productType: {
      type: String,
      enum: ['Software', 'Service', 'Physical', 'Addon'],
      default: 'Software'
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales price is required'],
      min: 0
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0,
      default: 0
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    variants: [variantSchema],
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', productSchema);
