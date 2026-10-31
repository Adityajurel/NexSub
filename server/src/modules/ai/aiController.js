const { queryFinancialAssistant, generateDunningDraft } = require('./aiService');
const Invoice = require('../../models/Invoice');
const { logAudit } = require('../../utils/auditLogger');
const { getEffectiveDate } = require('../../utils/demoClockService');

const handleQuery = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query string is required' });
    }

    const result = await queryFinancialAssistant(query);

    await logAudit({
      actor: req.user,
      action: 'AI_QUERY_PERFORMED',
      entityType: 'AI',
      description: `Natural language query: "${query.substring(0, 50)}..."`,
      req
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const handleDunningDraft = async (req, res, next) => {
  try {
    const { invoiceId, tone = 'firm' } = req.body;
    const invoice = await Invoice.findById(invoiceId).populate('customerId');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const now = getEffectiveDate();
    const diffTime = Math.max(0, now - new Date(invoice.dueDate));
    const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const result = await generateDunningDraft({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerId?.name || 'Customer',
      amountDue: invoice.amountDue,
      daysOverdue,
      tone
    });

    await logAudit({
      actor: req.user,
      action: 'AI_DUNNING_DRAFTED',
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Generated AI dunning draft (${tone}) for ${invoice.invoiceNumber}`,
      req
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleQuery,
  handleDunningDraft
};
