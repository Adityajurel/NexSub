const TaxRule = require('../../models/TaxRule');
const DiscountRule = require('../../models/DiscountRule');
const { calculatePricing } = require('../pricing/pricingEngine');
const { logAudit } = require('../../utils/auditLogger');

// TAX RULES
const getTaxRules = async (req, res, next) => {
  try {
    const rules = await TaxRule.find().sort({ priority: 1, name: 1 });
    res.json({ success: true, taxRules: rules });
  } catch (err) {
    next(err);
  }
};

const createTaxRule = async (req, res, next) => {
  try {
    const { name, code, rate, isInclusive, priority, appliesToProductTypes } = req.body;
    const rule = await TaxRule.create({
      name,
      code: code.toUpperCase(),
      rate,
      isInclusive: !!isInclusive,
      priority: priority || 1,
      appliesToProductTypes: appliesToProductTypes || []
    });

    await logAudit({
      actor: req.user,
      action: 'TAX_RULE_CREATED',
      entityType: 'TaxRule',
      entityId: rule._id,
      description: `Created tax rule: ${rule.name} (${rule.rate}%)`,
      req
    });

    res.status(201).json({ success: true, taxRule: rule });
  } catch (err) {
    next(err);
  }
};

const updateTaxRule = async (req, res, next) => {
  try {
    const rule = await TaxRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Tax rule not found' });

    Object.assign(rule, req.body);
    if (req.body.code) rule.code = req.body.code.toUpperCase();
    await rule.save();

    await logAudit({
      actor: req.user,
      action: 'TAX_RULE_UPDATED',
      entityType: 'TaxRule',
      entityId: rule._id,
      description: `Updated tax rule: ${rule.name}`,
      req
    });

    res.json({ success: true, taxRule: rule });
  } catch (err) {
    next(err);
  }
};

const deleteTaxRule = async (req, res, next) => {
  try {
    const rule = await TaxRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Tax rule not found' });
    rule.active = false;
    await rule.save();
    res.json({ success: true, message: 'Tax rule deactivated' });
  } catch (err) {
    next(err);
  }
};

// DISCOUNT RULES
const getDiscountRules = async (req, res, next) => {
  try {
    const rules = await DiscountRule.find()
      .populate('applicableProducts', 'name code')
      .populate('applicablePlans', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, discountRules: rules });
  } catch (err) {
    next(err);
  }
};

const createDiscountRule = async (req, res, next) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      value,
      targetType,
      minPurchaseAmount,
      minQuantity,
      startDate,
      endDate,
      usageLimit,
      applicableProducts,
      applicablePlans
    } = req.body;

    const existing = await DiscountRule.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Discount code already exists' });
    }

    const rule = await DiscountRule.create({
      code: code.toUpperCase(),
      name,
      description,
      discountType,
      value,
      targetType: targetType || 'Subscription',
      minPurchaseAmount: minPurchaseAmount || 0,
      minQuantity: minQuantity || 1,
      startDate: startDate || null,
      endDate: endDate || null,
      usageLimit: usageLimit || 0,
      applicableProducts: applicableProducts || [],
      applicablePlans: applicablePlans || []
    });

    await logAudit({
      actor: req.user,
      action: 'DISCOUNT_RULE_CREATED',
      entityType: 'DiscountRule',
      entityId: rule._id,
      description: `Created discount rule: ${rule.code} (${rule.value} ${rule.discountType})`,
      req
    });

    res.status(201).json({ success: true, discountRule: rule });
  } catch (err) {
    next(err);
  }
};

const updateDiscountRule = async (req, res, next) => {
  try {
    const rule = await DiscountRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Discount rule not found' });

    Object.assign(rule, req.body);
    if (req.body.code) rule.code = req.body.code.toUpperCase();
    await rule.save();

    await logAudit({
      actor: req.user,
      action: 'DISCOUNT_RULE_UPDATED',
      entityType: 'DiscountRule',
      entityId: rule._id,
      description: `Updated discount rule: ${rule.code}`,
      req
    });

    res.json({ success: true, discountRule: rule });
  } catch (err) {
    next(err);
  }
};

const deleteDiscountRule = async (req, res, next) => {
  try {
    const rule = await DiscountRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Discount rule not found' });
    rule.active = false;
    await rule.save();
    res.json({ success: true, message: 'Discount rule deactivated' });
  } catch (err) {
    next(err);
  }
};

// PRICING SIMULATOR
const previewPricingCalculation = async (req, res, next) => {
  try {
    const { lines, subscriptionDiscountRuleId, taxRuleIds, effectiveDate } = req.body;
    const result = await calculatePricing({
      lines,
      subscriptionDiscountRuleId,
      taxRuleIds,
      effectiveDate
    });
    res.json({ success: true, pricing: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
  getDiscountRules,
  createDiscountRule,
  updateDiscountRule,
  deleteDiscountRule,
  previewPricingCalculation
};
