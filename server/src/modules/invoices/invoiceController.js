const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const Payment = require('../../models/Payment');
const { generateInvoicePDF } = require('../../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../../utils/emailService');
const { logAudit } = require('../../utils/auditLogger');
const { getEffectiveDate } = require('../../utils/demoClockService');

const getInvoices = async (req, res, next) => {
  try {
    const { status, isOverdue, customerId, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (req.user.role === 'Customer') {
      filter.customerId = req.user._id;
    } else if (customerId) {
      filter.customerId = customerId;
    }

    if (status) filter.status = status;

    const now = getEffectiveDate();
    if (isOverdue === 'true') {
      filter.status = 'Confirmed';
      filter.dueDate = { $lt: now };
      filter.amountDue = { $gt: 0 };
    }

    if (search) {
      filter.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name email companyName phone')
        .populate('subscriptionId', 'subscriptionNumber billingFrequency')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(filter)
    ]);

    // Attach dynamic isOverdue
    const processedInvoices = invoices.map((inv) => {
      const obj = inv.toObject({ virtuals: true });
      obj.isOverdue = inv.status === 'Confirmed' && inv.dueDate < now && inv.amountDue > 0;
      return obj;
    });

    res.json({
      success: true,
      invoices: processedInvoices,
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

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email companyName phone address taxId')
      .populate('subscriptionId')
      .populate('lines.productId');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (req.user.role === 'Customer' && invoice.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const payments = await Payment.find({ invoiceId: invoice._id }).sort({ createdAt: -1 });

    const obj = invoice.toObject({ virtuals: true });
    const now = getEffectiveDate();
    obj.isOverdue = invoice.status === 'Confirmed' && invoice.dueDate < now && invoice.amountDue > 0;

    res.json({
      success: true,
      invoice: obj,
      payments
    });
  } catch (err) {
    next(err);
  }
};

const confirmInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.status !== 'Draft') {
      return res.status(400).json({ success: false, message: `Cannot confirm invoice in '${invoice.status}' state` });
    }

    invoice.status = 'Confirmed';
    await invoice.save();

    await logAudit({
      actor: req.user,
      action: 'INVOICE_CONFIRMED',
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Confirmed invoice ${invoice.invoiceNumber}`,
      req
    });

    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

const cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an invoice that is already fully paid.' });
    }

    invoice.status = 'Cancelled';
    await invoice.save();

    await logAudit({
      actor: req.user,
      action: 'INVOICE_CANCELLED',
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Cancelled invoice ${invoice.invoiceNumber}`,
      req
    });

    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

const sendInvoiceByEmail = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customerId');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (!invoice.customerId?.email) {
      return res.status(400).json({ success: false, message: 'Customer has no email configured' });
    }

    await sendInvoiceEmail({
      to: invoice.customerId.email,
      invoice,
      customerName: invoice.customerId.name
    });

    await logAudit({
      actor: req.user,
      action: 'INVOICE_EMAILED',
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Sent invoice ${invoice.invoiceNumber} to ${invoice.customerId.email}`,
      req
    });

    res.json({ success: true, message: `Invoice successfully sent to ${invoice.customerId.email}` });
  } catch (err) {
    next(err);
  }
};

const downloadPDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (req.user.role === 'Customer' && invoice.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const customer = await User.findById(invoice.customerId);
    generateInvoicePDF(invoice, customer, res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  confirmInvoice,
  cancelInvoice,
  sendInvoiceByEmail,
  downloadPDF
};
