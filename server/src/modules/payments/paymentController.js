const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../../models/Payment');
const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const { generatePaymentNumber } = require('../../utils/numberGenerator');
const { withTransaction } = require('../../config/db');
const { recordPaymentRecoverySuccess, handlePaymentFailure } = require('./recoveryEngine');
const { logAudit } = require('../../utils/auditLogger');
const env = require('../../config/env');

const getRazorpayClient = () => {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  if (keyId && keySecret && !keyId.includes('test_nexsub123456')) {
    try {
      return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    } catch (e) {
      console.warn('[Razorpay] Init error:', e.message);
    }
  }
  return null;
};

const getPayments = async (req, res, next) => {
  try {
    const { customerId, invoiceId, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (req.user.role === 'Customer') {
      filter.customerId = req.user._id;
    } else if (customerId) {
      filter.customerId = customerId;
    }

    if (invoiceId) filter.invoiceId = invoiceId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('customerId', 'name email companyName')
        .populate('invoiceId', 'invoiceNumber totalAmount amountDue status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      payments,
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

const recordPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod, transactionReference, notes } = req.body;

    if (!invoiceId || !amount || !paymentMethod || !transactionReference) {
      return res.status(400).json({
        success: false,
        message: 'invoiceId, amount, paymentMethod, and transactionReference are required.'
      });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    // Check duplicate transaction reference
    const existingPayment = await Payment.findOne({ transactionReference, invoiceId });
    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: `A payment with transaction reference '${transactionReference}' for this invoice has already been recorded.`
      });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    if (invoice.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot record payment for a cancelled invoice.' });
    }

    if (invoice.amountDue <= 0 || invoice.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already fully paid.' });
    }

    let createdPayment = null;

    await withTransaction(async (session) => {
      const paymentNumber = await generatePaymentNumber();

      const paymentDocs = await Payment.create(
        [
          {
            paymentNumber,
            invoiceId: invoice._id,
            customerId: invoice.customerId,
            amount: payAmount,
            paymentMethod,
            transactionReference,
            notes,
            status: 'Success'
          }
        ],
        session ? { session } : {}
      );
      createdPayment = paymentDocs[0];

      // Update invoice balances
      const newAmountPaid = Math.round((invoice.amountPaid + payAmount) * 100) / 100;
      const newAmountDue = Math.max(0, Math.round((invoice.totalAmount - newAmountPaid) * 100) / 100);
      const newStatus = newAmountDue <= 0 ? 'Paid' : 'Confirmed';

      invoice.amountPaid = newAmountPaid;
      invoice.amountDue = newAmountDue;
      invoice.status = newStatus;

      await invoice.save(session ? { session } : {});
    });

    // Mark debt recovery if was in recovery
    await recordPaymentRecoverySuccess(invoice._id, payAmount);

    await logAudit({
      actor: req.user,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: createdPayment._id,
      description: `Payment ${createdPayment.paymentNumber} of Rs. ${payAmount.toFixed(2)} recorded for Invoice ${invoice.invoiceNumber}. New balance due: Rs. ${invoice.amountDue.toFixed(2)}`,
      req
    });

    res.status(201).json({
      success: true,
      payment: createdPayment,
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amountPaid: invoice.amountPaid,
        amountDue: invoice.amountDue,
        status: invoice.status
      }
    });
  } catch (err) {
    next(err);
  }
};

// Razorpay Order Creation (Supports both live Razorpay keys and demo simulation)
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.amountDue <= 0 || invoice.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Invoice has no outstanding balance' });
    }

    const amountInPaise = Math.round(invoice.amountDue * 100);
    const rzpClient = getRazorpayClient();
    let orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    let isLiveOrder = false;

    if (rzpClient) {
      try {
        const rzpOrder = await rzpClient.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: invoice.invoiceNumber.slice(0, 40),
          notes: {
            invoiceId: invoice._id.toString(),
            invoiceNumber: invoice.invoiceNumber
          }
        });
        orderId = rzpOrder.id;
        isLiveOrder = true;
      } catch (err) {
        console.warn('[Razorpay] Live order creation warning:', err.message, '- falling back to simulated order');
      }
    }

    res.json({
      success: true,
      order: {
        id: orderId,
        amount: amountInPaise,
        currency: 'INR',
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        key: env.RAZORPAY_KEY_ID,
        isLiveOrder
      }
    });
  } catch (err) {
    next(err);
  }
};

// Razorpay Payment Verification & Instant Settlement
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { invoiceId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.status === 'Paid' || invoice.amountDue <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice is already settled' });
    }

    const rzpClient = getRazorpayClient();
    let isSignatureValid = false;

    if (rzpClient && env.RAZORPAY_KEY_SECRET) {
      const generated = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      isSignatureValid = generated === razorpay_signature;
    } else {
      // In development / demo test mode
      isSignatureValid = Boolean(
        razorpay_payment_id &&
        (razorpay_signature?.startsWith('mock_') ||
         razorpay_signature?.startsWith('sim_') ||
         !env.RAZORPAY_KEY_SECRET ||
         env.RAZORPAY_KEY_SECRET.includes('nexsub123456'))
      );
    }

    if (!isSignatureValid) {
      await handlePaymentFailure({
        invoiceId: invoice._id,
        customerId: invoice.customerId,
        amount: invoice.amountDue,
        errorMessage: 'Razorpay signature validation failed'
      });
      return res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature' });
    }

    // Process payment recording
    const paymentNumber = await generatePaymentNumber();
    const payment = await Payment.create({
      paymentNumber,
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      amount: invoice.amountDue,
      paymentMethod: 'Razorpay',
      transactionReference: razorpay_payment_id || `rzp_${Date.now()}`,
      status: 'Success',
      razorpayDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature
      }
    });

    invoice.amountPaid = invoice.totalAmount;
    invoice.amountDue = 0;
    invoice.status = 'Paid';
    await invoice.save();

    await recordPaymentRecoverySuccess(invoice._id, payment.amount);

    await logAudit({
      actor: req.user,
      action: 'RAZORPAY_PAYMENT_SUCCESS',
      entityType: 'Payment',
      entityId: payment._id,
      description: `Razorpay payment ${razorpay_payment_id} verified for Invoice ${invoice.invoiceNumber}`,
      req
    });

    res.json({
      success: true,
      message: 'Payment verified and invoice settled successfully',
      payment,
      invoice
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPayments,
  recordPayment,
  createRazorpayOrder,
  verifyRazorpayPayment
};
