const Quotation = require('../../models/Quotation');
const QuotationTemplate = require('../../models/QuotationTemplate');
const Subscription = require('../../models/Subscription');
const User = require('../../models/User');
const { calculatePricing } = require('../pricing/pricingEngine');
const { generateQuotationNumber, generateSubscriptionNumber } = require('../../utils/numberGenerator');
const { generateQuotationPDF } = require('../../utils/pdfGenerator');
const { calculateNextPeriod } = require('../billing/billingEngine');
const { getEffectiveDate } = require('../../utils/demoClockService');
const { logAudit } = require('../../utils/auditLogger');

// TEMPLATES
const getTemplates = async (req, res, next) => {
  try {
    const templates = await QuotationTemplate.find({ active: true })
      .populate('lines.productId')
      .populate('lines.planId')
      .sort({ name: 1 });
    res.json({ success: true, templates });
  } catch (err) {
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const { name, description, lines, defaultValidityDays, termsAndConditions } = req.body;
    const template = await QuotationTemplate.create({
      name,
      description,
      lines: lines || [],
      defaultValidityDays: defaultValidityDays || 30,
      termsAndConditions
    });
    res.status(201).json({ success: true, template });
  } catch (err) {
    next(err);
  }
};

// QUOTATIONS
const getQuotations = async (req, res, next) => {
  try {
    const { customerId, status } = req.query;
    const filter = {};

    // Customer role isolation
    if (req.user.role === 'Customer') {
      filter.customerId = req.user._id;
    } else if (customerId) {
      filter.customerId = customerId;
    }

    if (status) filter.status = status;

    const quotations = await Quotation.find(filter)
      .populate('customerId', 'name email companyName phone')
      .populate('planId', 'name code billingFrequency')
      .populate('discountRuleId', 'code name value discountType')
      .sort({ createdAt: -1 });

    res.json({ success: true, quotations });
  } catch (err) {
    next(err);
  }
};

const getQuotationById = async (req, res, next) => {
  try {
    const quote = await Quotation.findById(req.params.id)
      .populate('customerId', 'name email companyName phone address taxId')
      .populate('planId')
      .populate('lines.productId')
      .populate('discountRuleId');

    if (!quote) return res.status(404).json({ success: false, message: 'Quotation not found' });

    if (req.user.role === 'Customer' && quote.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, quotation: quote });
  } catch (err) {
    next(err);
  }
};

const createQuotation = async (req, res, next) => {
  try {
    const {
      customerId,
      planId,
      templateId,
      lines,
      discountRuleId,
      validityDays = 30,
      notes,
      termsAndConditions
    } = req.body;

    const pricing = await calculatePricing({
      lines,
      subscriptionDiscountRuleId: discountRuleId
    });

    const quotationNumber = await generateQuotationNumber();
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + Number(validityDays));

    const quotation = await Quotation.create({
      quotationNumber,
      templateId: templateId || null,
      customerId,
      planId,
      lines: pricing.lines,
      subtotal: pricing.subtotal,
      lineDiscountsTotal: pricing.lineDiscountsTotal,
      subscriptionDiscountAmount: pricing.subscriptionDiscountAmount,
      discountRuleId: discountRuleId || null,
      totalDiscount: pricing.totalDiscount,
      totalTax: pricing.totalTax,
      grandTotal: pricing.grandTotal,
      validityDate,
      status: 'Quotation', // Sent quotation
      notes,
      termsAndConditions
    });

    await logAudit({
      actor: req.user,
      action: 'QUOTATION_CREATED',
      entityType: 'Quotation',
      entityId: quotation._id,
      description: `Created quotation ${quotation.quotationNumber} for Rs. ${quotation.grandTotal.toFixed(2)}`,
      req
    });

    res.status(201).json({ success: true, quotation });
  } catch (err) {
    next(err);
  }
};

const updateQuotationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const quote = await Quotation.findById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quotation not found' });

    const validTransitions = {
      Draft: ['Quotation', 'Closed'],
      Quotation: ['Confirmed', 'Closed'],
      Confirmed: ['Active', 'Closed'],
      Active: ['Closed'],
      Closed: []
    };

    if (!validTransitions[quote.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from ${quote.status} to ${status}`
      });
    }

    quote.status = status;
    await quote.save();

    await logAudit({
      actor: req.user,
      action: 'QUOTATION_STATUS_CHANGED',
      entityType: 'Quotation',
      entityId: quote._id,
      description: `Quotation ${quote.quotationNumber} changed status to ${status}`,
      req
    });

    res.json({ success: true, quotation: quote });
  } catch (err) {
    next(err);
  }
};

const convertToSubscription = async (req, res, next) => {
  try {
    const quote = await Quotation.findById(req.params.id).populate('planId');
    if (!quote) return res.status(404).json({ success: false, message: 'Quotation not found' });

    if (quote.status === 'Active' || quote.convertedSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'This quotation has already been converted to a subscription.'
      });
    }

    const subNumber = await generateSubscriptionNumber();
    const startDate = getEffectiveDate();
    const nextBillingDate = startDate; // Immediate billing or anchor
    const frequency = quote.planId?.billingFrequency || 'Monthly';

    const subscription = await Subscription.create({
      subscriptionNumber: subNumber,
      customerId: quote.customerId,
      planId: quote.planId._id,
      lines: quote.lines,
      billingFrequency: frequency,
      startDate,
      nextBillingDate,
      paymentTerms: 'Immediate',
      subtotal: quote.subtotal,
      discountRuleId: quote.discountRuleId,
      subscriptionDiscountAmount: quote.subscriptionDiscountAmount,
      taxAmount: quote.totalTax,
      totalAmount: quote.grandTotal,
      status: 'Active',
      quotationId: quote._id,
      notes: `Converted from quotation ${quote.quotationNumber}`
    });

    quote.status = 'Active';
    quote.convertedSubscriptionId = subscription._id;
    await quote.save();

    await logAudit({
      actor: req.user,
      action: 'QUOTATION_CONVERTED_TO_SUBSCRIPTION',
      entityType: 'Subscription',
      entityId: subscription._id,
      description: `Quotation ${quote.quotationNumber} converted to Subscription ${subscription.subscriptionNumber}`,
      req
    });

    res.status(201).json({
      success: true,
      message: `Quotation converted to Subscription ${subscription.subscriptionNumber}`,
      subscription
    });
  } catch (err) {
    next(err);
  }
};

const downloadPDF = async (req, res, next) => {
  try {
    const quote = await Quotation.findById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quotation not found' });

    const customer = await User.findById(quote.customerId);
    generateQuotationPDF(quote, customer, res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
  convertToSubscription,
  downloadPDF
};
