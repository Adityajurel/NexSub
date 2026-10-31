const SystemSetting = require('../models/SystemSetting');
const { getEffectiveDate } = require('./demoClockService');

const getNextSequenceNumber = async (prefix) => {
  const year = getEffectiveDate().getFullYear();
  const counterKey = `seq_${prefix}_${year}`;

  const setting = await SystemSetting.findOneAndUpdate(
    { key: counterKey },
    { $inc: { value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const num = String(setting.value).padStart(4, '0');
  return `${prefix}-${year}-${num}`;
};

module.exports = {
  generateInvoiceNumber: () => getNextSequenceNumber('INV'),
  generateQuotationNumber: () => getNextSequenceNumber('QT'),
  generateSubscriptionNumber: () => getNextSequenceNumber('SUB'),
  generatePaymentNumber: () => getNextSequenceNumber('PAY'),
  generateBillingRunNumber: () => getNextSequenceNumber('BR')
};
