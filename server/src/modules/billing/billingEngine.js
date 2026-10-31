const Subscription = require('../../models/Subscription');
const Invoice = require('../../models/Invoice');
const BillingRun = require('../../models/BillingRun');
const BillingRunItem = require('../../models/BillingRunItem');
const DiscountRule = require('../../models/DiscountRule');
const Plan = require('../../models/Plan');
const { calculatePricing } = require('../pricing/pricingEngine');
const { generateInvoiceNumber, generateBillingRunNumber } = require('../../utils/numberGenerator');
const { getEffectiveDate } = require('../../utils/demoClockService');
const { withTransaction } = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');

/**
 * Calculates the next billing cycle end date given a start date and frequency.
 */
const calculateNextPeriod = (startDate, frequency) => {
  const next = new Date(startDate);
  switch (frequency) {
    case 'Daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'Weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'Monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'Yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
};

/**
 * Executes or simulates an idempotent billing run.
 */
const executeBillingRun = async ({
  mode = 'LIVE', // 'LIVE' | 'DRY_RUN'
  triggeredBy = 'MANUAL', // 'CRON' | 'MANUAL'
  simulationDate = null,
  actor = null,
  req = null
}) => {
  const startTime = Date.now();
  const runDate = simulationDate ? new Date(simulationDate) : getEffectiveDate();
  const runNumber = await generateBillingRunNumber();

  // Create BillingRun header record
  const billingRun = await BillingRun.create({
    runNumber,
    runDate: new Date(),
    simulationDate: simulationDate ? new Date(simulationDate) : null,
    mode,
    triggeredBy,
    status: 'RUNNING'
  });

  let totalEvaluated = 0;
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalAmountBilled = 0;
  const items = [];

  try {
    // Find active subscriptions due on or before runDate
    // Also ensuring no active lock lease is held
    const dueSubscriptions = await Subscription.find({
      status: 'Active',
      nextBillingDate: { $lte: runDate },
      $or: [
        { billingLockUntil: null },
        { billingLockUntil: { $lt: new Date() } }
      ]
    }).populate('planId').populate('customerId');

    totalEvaluated = dueSubscriptions.length;

    for (const sub of dueSubscriptions) {
      const lockLease = new Date(Date.now() + 60 * 1000); // 60s lock lease

      // In LIVE mode, acquire lock atomically
      if (mode === 'LIVE') {
        const locked = await Subscription.findOneAndUpdate(
          {
            _id: sub._id,
            status: 'Active',
            $or: [
              { billingLockUntil: null },
              { billingLockUntil: { $lt: new Date() } }
            ]
          },
          { $set: { billingLockUntil: lockLease } },
          { new: true }
        );

        if (!locked) {
          // Another concurrent worker claimed it
          continue;
        }
      }

      const periodStart = new Date(sub.nextBillingDate);
      const periodEnd = calculateNextPeriod(periodStart, sub.billingFrequency);

      // 1. Idempotency Check: check if invoice already exists for (subscriptionId, periodStart)
      const existingInvoice = await Invoice.findOne({
        subscriptionId: sub._id,
        periodStart
      });

      if (existingInvoice) {
        // Duplicate prevented!
        totalSkipped++;

        // Advance nextBillingDate if stuck in past
        if (mode === 'LIVE') {
          await Subscription.updateOne(
            { _id: sub._id },
            {
              $set: {
                nextBillingDate: periodEnd,
                billingLockUntil: null
              }
            }
          );
        }

        const item = await BillingRunItem.create({
          billingRunId: billingRun._id,
          subscriptionId: sub._id,
          customerId: sub.customerId._id,
          status: 'SKIPPED_DUPLICATE',
          invoiceId: existingInvoice._id,
          invoiceNumber: existingInvoice.invoiceNumber,
          amount: existingInvoice.totalAmount,
          periodStart,
          periodEnd,
          reason: `Invoice ${existingInvoice.invoiceNumber} already exists for period ${periodStart.toISOString().split('T')[0]}`
        });

        items.push(item);
        continue;
      }

      // 2. Pricing and Invoice Generation
      try {
        const pricing = await calculatePricing({
          lines: sub.lines,
          subscriptionDiscountRuleId: sub.discountRuleId,
          effectiveDate: runDate
        });

        if (mode === 'DRY_RUN') {
          totalCreated++;
          totalAmountBilled += pricing.grandTotal;

          const item = await BillingRunItem.create({
            billingRunId: billingRun._id,
            subscriptionId: sub._id,
            customerId: sub.customerId._id,
            status: 'CREATED',
            amount: pricing.grandTotal,
            periodStart,
            periodEnd,
            reason: `[DRY RUN] Will generate invoice for Rs. ${pricing.grandTotal.toFixed(2)}`
          });
          items.push(item);
          continue;
        }

        // LIVE MODE - Transactional Execution
        let generatedInvoice = null;

        await withTransaction(async (session) => {
          const invNumber = await generateInvoiceNumber();

          // Set due date according to payment terms (e.g. Net 15 = 15 days, Immediate = 1 day)
          const dueDate = new Date(runDate);
          if (sub.paymentTerms === 'Net 15') dueDate.setDate(dueDate.getDate() + 15);
          else if (sub.paymentTerms === 'Net 30') dueDate.setDate(dueDate.getDate() + 30);
          else dueDate.setDate(dueDate.getDate() + 3);

          const invoicePayload = {
            invoiceNumber: invNumber,
            subscriptionId: sub._id,
            customerId: sub.customerId._id,
            periodStart,
            periodEnd,
            lines: pricing.lines,
            subtotal: pricing.subtotal,
            lineDiscountsTotal: pricing.lineDiscountsTotal,
            subscriptionDiscountAmount: pricing.subscriptionDiscountAmount,
            totalDiscount: pricing.totalDiscount,
            totalTax: pricing.totalTax,
            totalAmount: pricing.grandTotal,
            amountPaid: 0,
            amountDue: pricing.grandTotal,
            dueDate,
            status: 'Confirmed',
            billingRunId: billingRun._id,
            notes: `Recurring billing for ${sub.subscriptionNumber}`
          };

          const createdInvoices = await Invoice.create([invoicePayload], session ? { session } : {});
          generatedInvoice = createdInvoices[0];

          // Increment discount usage if applicable
          if (sub.discountRuleId) {
            await DiscountRule.updateOne(
              { _id: sub.discountRuleId },
              { $inc: { usedCount: 1 } },
              session ? { session } : {}
            );
          }

          // Advance nextBillingDate and check expiry
          let nextStatus = 'Active';
          if (sub.expiryDate && new Date(sub.expiryDate) <= periodEnd) {
            if (sub.autoCloseOnExpiry) {
              nextStatus = 'Expired';
            }
          }

          await Subscription.updateOne(
            { _id: sub._id },
            {
              $set: {
                lastBilledDate: periodStart,
                nextBillingDate: periodEnd,
                status: nextStatus,
                billingLockUntil: null
              }
            },
            session ? { session } : {}
          );
        });

        totalCreated++;
        totalAmountBilled += pricing.grandTotal;

        const item = await BillingRunItem.create({
          billingRunId: billingRun._id,
          subscriptionId: sub._id,
          customerId: sub.customerId._id,
          status: 'CREATED',
          invoiceId: generatedInvoice._id,
          invoiceNumber: generatedInvoice.invoiceNumber,
          amount: pricing.grandTotal,
          periodStart,
          periodEnd,
          reason: `Successfully generated invoice ${generatedInvoice.invoiceNumber}`
        });

        items.push(item);
      } catch (err) {
        totalFailed++;

        if (mode === 'LIVE') {
          // Release lock on failure
          await Subscription.updateOne(
            { _id: sub._id },
            { $set: { billingLockUntil: null } }
          );
        }

        const item = await BillingRunItem.create({
          billingRunId: billingRun._id,
          subscriptionId: sub._id,
          customerId: sub.customerId._id,
          status: 'FAILED',
          periodStart,
          periodEnd,
          reason: `Error: ${err.message}`,
          retryable: true
        });
        items.push(item);
      }
    }

    billingRun.status = 'COMPLETED';
    billingRun.totalEvaluated = totalEvaluated;
    billingRun.totalCreated = totalCreated;
    billingRun.totalSkipped = totalSkipped;
    billingRun.totalFailed = totalFailed;
    billingRun.totalAmountBilled = Math.round(totalAmountBilled * 100) / 100;
    billingRun.durationMs = Date.now() - startTime;
    await billingRun.save();

    await logAudit({
      actor,
      action: 'BILLING_RUN_EXECUTED',
      entityType: 'BillingRun',
      entityId: billingRun._id,
      description: `${mode} billing run completed: ${totalCreated} created, ${totalSkipped} skipped, ${totalFailed} failed. Total Rs. ${totalAmountBilled.toFixed(2)}`,
      afterState: {
        runNumber: billingRun.runNumber,
        mode,
        totalCreated,
        totalSkipped,
        totalFailed,
        totalAmountBilled
      },
      req
    });

    return {
      billingRun,
      items
    };
  } catch (globalError) {
    billingRun.status = 'FAILED';
    billingRun.error = globalError.message;
    billingRun.durationMs = Date.now() - startTime;
    await billingRun.save();
    throw globalError;
  }
};

module.exports = {
  executeBillingRun,
  calculateNextPeriod
};
