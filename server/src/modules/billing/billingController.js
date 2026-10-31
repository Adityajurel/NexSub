const BillingRun = require('../../models/BillingRun');
const BillingRunItem = require('../../models/BillingRunItem');
const Subscription = require('../../models/Subscription');
const { executeBillingRun } = require('./billingEngine');
const { getEffectiveDate } = require('../../utils/demoClockService');

const triggerBillingRun = async (req, res, next) => {
  try {
    const { mode = 'LIVE', simulationDate = null } = req.body;

    const result = await executeBillingRun({
      mode,
      triggeredBy: 'MANUAL',
      simulationDate,
      actor: req.user,
      req
    });

    res.json({
      success: true,
      message: `${mode} billing run completed successfully.`,
      billingRun: result.billingRun,
      items: result.items
    });
  } catch (err) {
    next(err);
  }
};

const getBillingRuns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [runs, total] = await Promise.all([
      BillingRun.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      BillingRun.countDocuments()
    ]);

    res.json({
      success: true,
      runs,
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

const getBillingRunDetails = async (req, res, next) => {
  try {
    const run = await BillingRun.findById(req.params.id);
    if (!run) return res.status(404).json({ success: false, message: 'Billing run not found' });

    const items = await BillingRunItem.find({ billingRunId: run._id })
      .populate('subscriptionId', 'subscriptionNumber billingFrequency')
      .populate('customerId', 'name email companyName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      billingRun: run,
      items
    });
  } catch (err) {
    next(err);
  }
};

const previewUpcomingBilling = async (req, res, next) => {
  try {
    const currentDate = getEffectiveDate();
    const dueSubs = await Subscription.find({
      status: 'Active',
      nextBillingDate: { $lte: currentDate }
    })
      .populate('customerId', 'name email companyName')
      .populate('planId', 'name code billingFrequency');

    res.json({
      success: true,
      asOfDate: currentDate,
      totalDue: dueSubs.length,
      subscriptions: dueSubs
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  triggerBillingRun,
  getBillingRuns,
  getBillingRunDetails,
  previewUpcomingBilling
};
