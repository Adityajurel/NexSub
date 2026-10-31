const Subscription = require('../../models/Subscription');
const Invoice = require('../../models/Invoice');
const Payment = require('../../models/Payment');
const PaymentRecovery = require('../../models/PaymentRecovery');
const User = require('../../models/User');
const { getEffectiveDate } = require('../../utils/demoClockService');

const getDashboardOverview = async (req, res, next) => {
  try {
    const now = getEffectiveDate();

    // 1. Subscriptions & MRR / ARR
    const activeSubs = await Subscription.find({ status: 'Active' });
    let mrr = 0;
    activeSubs.forEach((sub) => {
      const amt = sub.totalAmount || 0;
      switch (sub.billingFrequency) {
        case 'Monthly':
          mrr += amt;
          break;
        case 'Yearly':
          mrr += amt / 12;
          break;
        case 'Weekly':
          mrr += (amt * 52) / 12;
          break;
        case 'Daily':
          mrr += (amt * 365) / 12;
          break;
        default:
          mrr += amt;
      }
    });
    const arr = mrr * 12;

    // 2. Counts
    const [
      totalCustomers,
      closedSubsCount,
      pausedSubsCount,
      revenueResult,
      outstandingResult,
      overdueInvoices,
      failedPaymentsCount,
      recoveredRevenueResult
    ] = await Promise.all([
      User.countDocuments({ role: 'Customer' }),
      Subscription.countDocuments({ status: { $in: ['Closed', 'Expired'] } }),
      Subscription.countDocuments({ status: 'Paused' }),
      Payment.aggregate([
        { $match: { status: 'Success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Invoice.aggregate([
        { $match: { status: 'Confirmed' } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } }
      ]),
      Invoice.find({
        status: 'Confirmed',
        dueDate: { $lt: now },
        amountDue: { $gt: 0 }
      }).select('amountDue invoiceNumber dueDate customerId').populate('customerId', 'name email companyName'),
      Payment.countDocuments({ status: 'Failed' }),
      PaymentRecovery.aggregate([
        { $match: { status: 'Recovered' } },
        { $group: { _id: null, total: { $sum: '$recoveredAmount' } } }
      ])
    ]);

    const totalRevenueCollected = revenueResult[0]?.total || 0;
    const totalOutstanding = outstandingResult[0]?.total || 0;
    const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const recoveredRevenue = recoveredRevenueResult[0]?.total || 0;

    // 3. Upcoming renewals (next 7 days)
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const upcomingRenewals = await Subscription.find({
      status: 'Active',
      nextBillingDate: { $gte: now, $lte: sevenDaysLater }
    })
      .populate('customerId', 'name email companyName')
      .populate('planId', 'name')
      .limit(10);

    // 4. Monthly Revenue Trend (last 6 months)
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'Success',
          paymentDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueTrend = monthlyRevenue.map((item) => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: Math.round(item.revenue)
    }));

    // 5. Subscription Status Distribution
    const statusDistribution = [
      { name: 'Active', count: activeSubs.length, fill: '#10b981' },
      { name: 'Paused', count: pausedSubsCount, fill: '#f59e0b' },
      { name: 'Closed / Expired', count: closedSubsCount, fill: '#64748b' }
    ];

    res.json({
      success: true,
      metrics: {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        totalActiveSubscriptions: activeSubs.length,
        totalCustomers,
        totalRevenueCollected: Math.round(totalRevenueCollected * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        overdueCount: overdueInvoices.length,
        overdueTotal: Math.round(overdueTotal * 100) / 100,
        failedPaymentsCount,
        recoveredRevenue: Math.round(recoveredRevenue * 100) / 100
      },
      charts: {
        revenueTrend,
        statusDistribution
      },
      overdueInvoices,
      upcomingRenewals
    });
  } catch (err) {
    next(err);
  }
};

const getDetailedFinancialReport = async (req, res, next) => {
  try {
    const { range = '30d', startDate, endDate } = req.query;
    const now = getEffectiveDate();
    let start = new Date(now);

    if (range === '7d') start.setDate(start.getDate() - 7);
    else if (range === '30d') start.setDate(start.getDate() - 30);
    else if (range === '90d') start.setDate(start.getDate() - 90);
    else if (range === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      now.setTime(new Date(endDate).getTime());
    } else {
      start.setDate(start.getDate() - 30);
    }

    const [invoicesInPeriod, paymentsInPeriod, recoveriesInPeriod] = await Promise.all([
      Invoice.find({ createdAt: { $gte: start, $lte: now } }).populate('customerId', 'name email companyName'),
      Payment.find({ paymentDate: { $gte: start, $lte: now } }).populate('customerId', 'name email companyName'),
      PaymentRecovery.find({ createdAt: { $gte: start, $lte: now } }).populate('customerId', 'name')
    ]);

    const totalInvoiced = invoicesInPeriod.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalCollected = paymentsInPeriod.filter((p) => p.status === 'Success').reduce((sum, p) => sum + p.amount, 0);
    const totalDiscountsGiven = invoicesInPeriod.reduce((sum, i) => sum + i.totalDiscount, 0);
    const totalTaxesCollected = invoicesInPeriod.reduce((sum, i) => sum + i.totalTax, 0);
    const totalRecovered = recoveriesInPeriod.filter((r) => r.status === 'Recovered').reduce((sum, r) => sum + r.recoveredAmount, 0);

    res.json({
      success: true,
      period: { start, end: now, range },
      summary: {
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        totalDiscountsGiven: Math.round(totalDiscountsGiven * 100) / 100,
        totalTaxesCollected: Math.round(totalTaxesCollected * 100) / 100,
        totalRecovered: Math.round(totalRecovered * 100) / 100,
        invoicesCount: invoicesInPeriod.length,
        paymentsCount: paymentsInPeriod.length
      },
      invoices: invoicesInPeriod,
      payments: paymentsInPeriod
    });
  } catch (err) {
    next(err);
  }
};

const exportFinancialsCSV = async (req, res, next) => {
  try {
    const invoices = await Invoice.find()
      .populate('customerId', 'name email companyName')
      .sort({ createdAt: -1 });

    let csv = 'Invoice Number,Customer Name,Company,Date,Due Date,Total Amount,Amount Paid,Amount Due,Status\n';

    invoices.forEach((inv) => {
      const cust = inv.customerId?.name ? `"${inv.customerId.name.replace(/"/g, '""')}"` : '""';
      const comp = inv.customerId?.companyName ? `"${inv.customerId.companyName.replace(/"/g, '""')}"` : '""';
      const dt = new Date(inv.createdAt).toISOString().split('T')[0];
      const due = new Date(inv.dueDate).toISOString().split('T')[0];

      csv += `${inv.invoiceNumber},${cust},${comp},${dt},${due},${inv.totalAmount},${inv.amountPaid},${inv.amountDue},${inv.status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="NexSub-Financial-Report.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardOverview,
  getDetailedFinancialReport,
  exportFinancialsCSV
};
