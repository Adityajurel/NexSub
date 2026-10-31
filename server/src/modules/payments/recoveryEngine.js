const PaymentRecovery = require('../../models/PaymentRecovery');
const Invoice = require('../../models/Invoice');
const { sendPaymentReminderEmail } = require('../../utils/emailService');
const { getEffectiveDate } = require('../../utils/demoClockService');
const { logAudit } = require('../../utils/auditLogger');

/**
 * Initiates or updates a recovery workflow when a payment fails on an invoice.
 */
const handlePaymentFailure = async ({ invoiceId, customerId, amount, errorMessage }) => {
  const currentDate = getEffectiveDate();
  const nextRetryDate = new Date(currentDate);
  nextRetryDate.setDate(nextRetryDate.getDate() + 2); // Retry after 2 days

  let recovery = await PaymentRecovery.findOne({ invoiceId });

  if (!recovery) {
    recovery = await PaymentRecovery.create({
      invoiceId,
      customerId,
      amount,
      attemptCount: 1,
      maxAttempts: 3,
      nextRetryDate,
      lastAttemptDate: currentDate,
      status: 'Pending',
      retryLogs: [
        {
          attemptDate: currentDate,
          outcome: 'Failed',
          message: errorMessage || 'Initial payment failed'
        }
      ]
    });
  } else {
    recovery.attemptCount += 1;
    recovery.lastAttemptDate = currentDate;

    if (recovery.attemptCount >= recovery.maxAttempts) {
      recovery.status = 'Abandoned';
    } else {
      recovery.status = 'In_Progress';
      recovery.nextRetryDate = nextRetryDate;
    }

    recovery.retryLogs.push({
      attemptDate: currentDate,
      outcome: 'Failed',
      message: errorMessage || `Retry #${recovery.attemptCount} failed`
    });

    await recovery.save();
  }

  // Send reminder email to customer asynchronously
  const invoice = await Invoice.findById(invoiceId).populate('customerId');
  if (invoice?.customerId?.email) {
    sendPaymentReminderEmail({
      to: invoice.customerId.email,
      invoice,
      customerName: invoice.customerId.name
    }).catch((err) => console.error('[Recovery Email Error]:', err.message));
  }

  return recovery;
};

/**
 * Marks recovery record as successfully recovered when payment is made.
 */
const recordPaymentRecoverySuccess = async (invoiceId, paidAmount) => {
  const recovery = await PaymentRecovery.findOne({ invoiceId });
  if (recovery && recovery.status !== 'Recovered') {
    recovery.status = 'Recovered';
    recovery.recoveredAmount = paidAmount;
    recovery.recoveredAt = getEffectiveDate();
    recovery.retryLogs.push({
      attemptDate: getEffectiveDate(),
      outcome: 'Success',
      message: `Payment of Rs. ${paidAmount.toFixed(2)} received. Debt recovered!`
    });
    await recovery.save();
  }
};

/**
 * Evaluates pending recovery records due for retry.
 */
const processDueRecoveries = async () => {
  const currentDate = getEffectiveDate();
  const dueRecoveries = await PaymentRecovery.find({
    status: { $in: ['Pending', 'In_Progress'] },
    nextRetryDate: { $lte: currentDate }
  }).populate('invoiceId').populate('customerId');

  const results = [];

  for (const rec of dueRecoveries) {
    if (!rec.invoiceId || rec.invoiceId.amountDue <= 0) {
      // Invoice was already paid
      rec.status = 'Recovered';
      rec.recoveredAmount = rec.amount;
      rec.recoveredAt = currentDate;
      await rec.save();
      results.push({ id: rec._id, outcome: 'Already Paid / Recovered' });
      continue;
    }

    rec.attemptCount += 1;
    rec.lastAttemptDate = currentDate;

    // Simulate sending payment reminder / retry request
    const notificationSent = true;
    if (rec.customerId?.email) {
      sendPaymentReminderEmail({
        to: rec.customerId.email,
        invoice: rec.invoiceId,
        customerName: rec.customerId.name
      }).catch((e) => console.error(e.message));
    }

    if (rec.attemptCount >= rec.maxAttempts) {
      rec.status = 'Abandoned';
    } else {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 3);
      rec.nextRetryDate = nextDate;
    }

    rec.retryLogs.push({
      attemptDate: currentDate,
      outcome: 'Failed',
      message: `Automated retry reminder #${rec.attemptCount} sent.`,
      notificationSent
    });

    await rec.save();
    results.push({ id: rec._id, status: rec.status, attempt: rec.attemptCount });
  }

  return results;
};

module.exports = {
  handlePaymentFailure,
  recordPaymentRecoverySuccess,
  processDueRecoveries
};
