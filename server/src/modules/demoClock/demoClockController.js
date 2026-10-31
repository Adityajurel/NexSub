const {
  getEffectiveDate,
  setDemoDate,
  clearDemoDate,
  advanceDateBy,
  isDemoClockActive
} = require('../../utils/demoClockService');
const { executeBillingRun } = require('../billing/billingEngine');
const { logAudit } = require('../../utils/auditLogger');

const getStatus = async (req, res) => {
  const effectiveDate = getEffectiveDate();
  res.json({
    success: true,
    isSimulated: isDemoClockActive(),
    effectiveDate,
    systemDate: new Date()
  });
};

const setDate = async (req, res, next) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const newDate = await setDemoDate(date);

    await logAudit({
      actor: req.user,
      action: 'DEMO_CLOCK_SET',
      entityType: 'SystemSetting',
      description: `Demo Clock simulated date set to: ${newDate.toISOString()}`,
      req
    });

    res.json({
      success: true,
      message: `Demo Clock simulated date set to ${newDate.toISOString().split('T')[0]}`,
      effectiveDate: newDate,
      isSimulated: true
    });
  } catch (err) {
    next(err);
  }
};

const advance = async (req, res, next) => {
  try {
    const { days = 0, weeks = 0, months = 0, years = 0 } = req.body;
    const newDate = await advanceDateBy({ days, weeks, months, years });

    await logAudit({
      actor: req.user,
      action: 'DEMO_CLOCK_ADVANCED',
      entityType: 'SystemSetting',
      description: `Demo Clock advanced to: ${newDate.toISOString()}`,
      req
    });

    res.json({
      success: true,
      message: `Demo Clock advanced to ${newDate.toISOString().split('T')[0]}`,
      effectiveDate: newDate,
      isSimulated: true
    });
  } catch (err) {
    next(err);
  }
};

const reset = async (req, res, next) => {
  try {
    await clearDemoDate();

    await logAudit({
      actor: req.user,
      action: 'DEMO_CLOCK_RESET',
      entityType: 'SystemSetting',
      description: 'Demo Clock reset to real system time',
      req
    });

    res.json({
      success: true,
      message: 'Demo Clock reset to actual system time',
      effectiveDate: new Date(),
      isSimulated: false
    });
  } catch (err) {
    next(err);
  }
};

const simulateBillingCycle = async (req, res, next) => {
  try {
    const { mode = 'LIVE' } = req.body;
    const simDate = getEffectiveDate();

    const result = await executeBillingRun({
      mode,
      triggeredBy: 'MANUAL',
      simulationDate: simDate,
      actor: req.user,
      req
    });

    res.json({
      success: true,
      message: `Executed ${mode} billing run for simulated date ${simDate.toISOString().split('T')[0]}`,
      simulationDate: simDate,
      billingRun: result.billingRun,
      items: result.items
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStatus,
  setDate,
  advance,
  reset,
  simulateBillingCycle
};
