const Subscription = require('../../models/Subscription');
const Plan = require('../../models/Plan');
const Invoice = require('../../models/Invoice');
const { calculatePricing } = require('../pricing/pricingEngine');
const { generateSubscriptionNumber } = require('../../utils/numberGenerator');
const { getEffectiveDate } = require('../../utils/demoClockService');
const { calculateNextPeriod } = require('../billing/billingEngine');
const { logAudit } = require('../../utils/auditLogger');

const getSubscriptions = async (req, res, next) => {
  try {
    const { status, customerId, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (req.user.role === 'Customer') {
      filter.customerId = req.user._id;
    } else if (customerId) {
      filter.customerId = customerId;
    }

    if (status) filter.status = status;
    if (search) {
      filter.subscriptionNumber = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate('customerId', 'name email companyName phone')
        .populate('planId', 'name code billingFrequency allowPause allowEarlyClosure allowRenewal')
        .populate('discountRuleId', 'code name value discountType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Subscription.countDocuments(filter)
    ]);

    res.json({
      success: true,
      subscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const getSubscriptionById = async (req, res, next) => {
  try {
    const sub = await Subscription.findById(req.params.id)
      .populate('customerId', 'name email companyName phone address taxId')
      .populate('planId')
      .populate('lines.productId')
      .populate('discountRuleId');

    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (req.user.role === 'Customer' && sub.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Also get associated invoices and history
    const invoices = await Invoice.find({ subscriptionId: sub._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      subscription: sub,
      invoices
    });
  } catch (err) {
    next(err);
  }
};

const createSubscription = async (req, res, next) => {
  try {
    const {
      customerId,
      planId,
      lines,
      discountRuleId,
      startDate,
      expiryDate,
      paymentTerms = 'Immediate',
      notes
    } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const pricing = await calculatePricing({
      lines,
      subscriptionDiscountRuleId: discountRuleId
    });

    const subscriptionNumber = await generateSubscriptionNumber();
    const effectiveStart = startDate ? new Date(startDate) : getEffectiveDate();
    const nextBillingDate = effectiveStart;

    const subscription = await Subscription.create({
      subscriptionNumber,
      customerId,
      planId,
      lines: pricing.lines,
      billingFrequency: plan.billingFrequency,
      startDate: effectiveStart,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      nextBillingDate,
      paymentTerms,
      subtotal: pricing.subtotal,
      discountRuleId: discountRuleId || null,
      subscriptionDiscountAmount: pricing.subscriptionDiscountAmount,
      taxAmount: pricing.totalTax,
      totalAmount: pricing.grandTotal,
      status: 'Active',
      autoCloseOnExpiry: plan.autoClosureRules?.autoCloseOnExpiry ?? true,
      notes
    });

    await logAudit({
      actor: req.user,
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'Subscription',
      entityId: subscription._id,
      description: `Created subscription ${subscription.subscriptionNumber} (${plan.name}) for Rs. ${subscription.totalAmount.toFixed(2)}`,
      req
    });

    res.status(201).json({ success: true, subscription });
  } catch (err) {
    next(err);
  }
};

const pauseSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findById(req.params.id).populate('planId');
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (req.user.role === 'Customer' && sub.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!sub.planId?.allowPause) {
      return res.status(400).json({
        success: false,
        message: 'Pausing is not permitted under this subscription plan.'
      });
    }

    if (sub.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Cannot pause subscription in '${sub.status}' state.`
      });
    }

    const beforeState = { status: sub.status, nextBillingDate: sub.nextBillingDate };
    sub.status = 'Paused';
    sub.pauseDate = getEffectiveDate();
    await sub.save();

    await logAudit({
      actor: req.user,
      action: 'SUBSCRIPTION_PAUSED',
      entityType: 'Subscription',
      entityId: sub._id,
      description: `Paused subscription ${sub.subscriptionNumber}`,
      beforeState,
      afterState: { status: sub.status, pauseDate: sub.pauseDate },
      req
    });

    res.json({ success: true, subscription: sub });
  } catch (err) {
    next(err);
  }
};

const resumeSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (req.user.role === 'Customer' && sub.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (sub.status !== 'Paused') {
      return res.status(400).json({
        success: false,
        message: `Cannot resume subscription in '${sub.status}' state.`
      });
    }

    const beforeState = { status: sub.status, nextBillingDate: sub.nextBillingDate };
    const now = getEffectiveDate();

    // Re-anchor nextBillingDate forward to now if it was in the past while paused
    if (new Date(sub.nextBillingDate) < now) {
      sub.nextBillingDate = now;
    }

    sub.status = 'Active';
    sub.resumeDate = now;
    await sub.save();

    await logAudit({
      actor: req.user,
      action: 'SUBSCRIPTION_RESUMED',
      entityType: 'Subscription',
      entityId: sub._id,
      description: `Resumed subscription ${sub.subscriptionNumber}`,
      beforeState,
      afterState: { status: sub.status, resumeDate: sub.resumeDate, nextBillingDate: sub.nextBillingDate },
      req
    });

    res.json({ success: true, subscription: sub });
  } catch (err) {
    next(err);
  }
};

const renewSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findById(req.params.id).populate('planId');
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (!sub.planId?.allowRenewal) {
      return res.status(400).json({
        success: false,
        message: 'Renewal is not permitted under this plan.'
      });
    }

    const now = getEffectiveDate();
    const newExpiry = calculateNextPeriod(sub.expiryDate || now, sub.billingFrequency);

    sub.status = 'Active';
    sub.expiryDate = newExpiry;
    if (new Date(sub.nextBillingDate) < now) {
      sub.nextBillingDate = now;
    }
    await sub.save();

    await logAudit({
      actor: req.user,
      action: 'SUBSCRIPTION_RENEWED',
      entityType: 'Subscription',
      entityId: sub._id,
      description: `Renewed subscription ${sub.subscriptionNumber} until ${newExpiry.toISOString().split('T')[0]}`,
      req
    });

    res.json({ success: true, subscription: sub });
  } catch (err) {
    next(err);
  }
};

const closeSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findById(req.params.id).populate('planId');
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (req.user.role === 'Customer') {
      if (sub.customerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (!sub.planId?.allowEarlyClosure) {
        return res.status(400).json({
          success: false,
          message: 'Early closure is not permitted for your plan. Please contact support.'
        });
      }
    }

    if (sub.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Subscription is already closed.' });
    }

    sub.status = 'Closed';
    await sub.save();

    await logAudit({
      actor: req.user,
      action: 'SUBSCRIPTION_CLOSED',
      entityType: 'Subscription',
      entityId: sub._id,
      description: `Closed subscription ${sub.subscriptionNumber}`,
      req
    });

    res.json({ success: true, subscription: sub });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  closeSubscription
};
