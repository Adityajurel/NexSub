const Product = require('../../models/Product');
const Plan = require('../../models/Plan');
const { logAudit } = require('../../utils/auditLogger');

// PRODUCTS
const getProducts = async (req, res, next) => {
  try {
    const { search, productType, active } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (productType) filter.productType = productType;
    if (active !== undefined) filter.active = active === 'true';

    const products = await Product.find(filter).sort({ name: 1 });
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, code, productType, salesPrice, costPrice, description, notes, variants } = req.body;

    const existing = await Product.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Product code already in use' });
    }

    const product = await Product.create({
      name,
      code: code.toUpperCase(),
      productType,
      salesPrice,
      costPrice: costPrice || 0,
      description,
      notes,
      variants: variants || []
    });

    await logAudit({
      actor: req.user,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product._id,
      description: `Created product: ${product.name} (${product.code})`,
      afterState: product.toJSON(),
      req
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const beforeState = product.toJSON();
    Object.assign(product, req.body);
    if (req.body.code) product.code = req.body.code.toUpperCase();

    await product.save();

    await logAudit({
      actor: req.user,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: product._id,
      description: `Updated product: ${product.name} (${product.code})`,
      beforeState,
      afterState: product.toJSON(),
      req
    });

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.active = false;
    await product.save();

    await logAudit({
      actor: req.user,
      action: 'PRODUCT_DEACTIVATED',
      entityType: 'Product',
      entityId: product._id,
      description: `Deactivated product: ${product.name}`,
      req
    });

    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// PLANS
const getPlans = async (req, res, next) => {
  try {
    const { billingFrequency, active } = req.query;
    const filter = {};
    if (billingFrequency) filter.billingFrequency = billingFrequency;
    if (active !== undefined) filter.active = active === 'true';

    const plans = await Plan.find(filter).sort({ name: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const {
      name,
      code,
      billingFrequency,
      minimumQuantity,
      availabilityStartDate,
      availabilityEndDate,
      allowPause,
      allowEarlyClosure,
      allowRenewal,
      autoClosureRules,
      description
    } = req.body;

    const existing = await Plan.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Plan code already in use' });
    }

    const plan = await Plan.create({
      name,
      code: code.toUpperCase(),
      billingFrequency,
      minimumQuantity: minimumQuantity || 1,
      availabilityStartDate,
      availabilityEndDate,
      allowPause: allowPause !== undefined ? allowPause : true,
      allowEarlyClosure: allowEarlyClosure !== undefined ? allowEarlyClosure : true,
      allowRenewal: allowRenewal !== undefined ? allowRenewal : true,
      autoClosureRules: autoClosureRules || { autoCloseOnExpiry: true, gracePeriodDays: 0 },
      description
    });

    await logAudit({
      actor: req.user,
      action: 'PLAN_CREATED',
      entityType: 'Plan',
      entityId: plan._id,
      description: `Created plan: ${plan.name} (${plan.code})`,
      afterState: plan.toJSON(),
      req
    });

    res.status(201).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const beforeState = plan.toJSON();
    Object.assign(plan, req.body);
    if (req.body.code) plan.code = req.body.code.toUpperCase();

    await plan.save();

    await logAudit({
      actor: req.user,
      action: 'PLAN_UPDATED',
      entityType: 'Plan',
      entityId: plan._id,
      description: `Updated plan: ${plan.name} (${plan.code})`,
      beforeState,
      afterState: plan.toJSON(),
      req
    });

    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    plan.active = false;
    await plan.save();

    await logAudit({
      actor: req.user,
      action: 'PLAN_DEACTIVATED',
      entityType: 'Plan',
      entityId: plan._id,
      description: `Deactivated plan: ${plan.name}`,
      req
    });

    res.json({ success: true, message: 'Plan deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};
