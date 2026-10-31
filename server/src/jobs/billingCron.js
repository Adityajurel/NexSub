const cron = require('node-cron');
const { executeBillingRun } = require('../modules/billing/billingEngine');
const { processDueRecoveries } = require('../modules/payments/recoveryEngine');

let cronTask = null;

const startBillingCron = () => {
  // Run every 5 minutes in background
  cronTask = cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[Cron] Executing scheduled automated recurring billing run...');
      const result = await executeBillingRun({
        mode: 'LIVE',
        triggeredBy: 'CRON'
      });
      console.log(`[Cron] Billing run finished: ${result.billingRun.runNumber} (${result.billingRun.totalCreated} created, ${result.billingRun.totalSkipped} skipped)`);

      // Process payment recoveries
      await processDueRecoveries();
    } catch (err) {
      console.error('[Cron Error] Error in scheduled billing run:', err.message);
    }
  });

  console.log('[Cron] Automated billing scheduler active (Interval: 5m).');
};

const stopBillingCron = () => {
  if (cronTask) {
    cronTask.stop();
  }
};

module.exports = {
  startBillingCron,
  stopBillingCron
};
