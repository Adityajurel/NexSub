const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const TaxRule = require('../models/TaxRule');
const DiscountRule = require('../models/DiscountRule');
const QuotationTemplate = require('../models/QuotationTemplate');
const Quotation = require('../models/Quotation');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const PaymentRecovery = require('../models/PaymentRecovery');
const BillingRun = require('../models/BillingRun');
const BillingRunItem = require('../models/BillingRunItem');
const AuditLog = require('../models/AuditLog');
const SystemSetting = require('../models/SystemSetting');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('[Seed] Connected. Clearing previous seed collections...');

    // Clear all existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Plan.deleteMany({}),
      TaxRule.deleteMany({}),
      DiscountRule.deleteMany({}),
      QuotationTemplate.deleteMany({}),
      Quotation.deleteMany({}),
      Subscription.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      PaymentRecovery.deleteMany({}),
      BillingRun.deleteMany({}),
      BillingRunItem.deleteMany({}),
      AuditLog.deleteMany({}),
      SystemSetting.deleteMany({})
    ]);

    console.log('[Seed] Inserting Users...');
    // 1. Users
    const admin = await User.create({
      name: 'NexSub Admin',
      email: 'admin@nexsub.com',
      password: 'Admin@12345',
      role: 'Admin',
      companyName: 'NexSub HQ Inc.',
      phone: '+91 99887 76655'
    });

    const staff1 = await User.create({
      name: 'Aditya Staff',
      email: 'staff@nexsub.com',
      password: 'Staff@12345',
      role: 'Staff',
      companyName: 'NexSub Operations',
      phone: '+91 98765 43210'
    });

    const staff2 = await User.create({
      name: 'Anupam Finance',
      email: 'billing@nexsub.com',
      password: 'Staff@12345',
      role: 'Staff',
      companyName: 'NexSub Finance Dept.',
      phone: '+91 98111 22334'
    });

    // 22 Customers
    const customerSeedList = [
      { name: 'Rohan Sharma', email: 'rohan@infosyslabs.com', companyName: 'Infosys Labs Pvt Ltd', phone: '+91 98123 45678' },
      { name: 'Priya Iyer', email: 'priya@zerodhacorp.in', companyName: 'Zerodha Tech Ventures', phone: '+91 98234 56789' },
      { name: 'Karan Mehra', email: 'karan@swiggycloud.io', companyName: 'Swiggy Cloud Solutions', phone: '+91 98345 67890' },
      { name: 'Neha Gupta', email: 'neha@razorpaycore.net', companyName: 'Razorpay Corp Platforms', phone: '+91 98456 78901' },
      { name: 'Vikram Joshi', email: 'vikram@credsystems.co', companyName: 'Cred Financial Systems', phone: '+91 98567 89012' },
      { name: 'Ananya Roy', email: 'ananya@growwfintech.org', companyName: 'Groww Platforms Ltd', phone: '+91 98678 90123' },
      { name: 'Arjun Verma', email: 'arjun@flipkartlogistics.biz', companyName: 'Flipkart Logistics Network', phone: '+91 98789 01234' },
      { name: 'Sneha Patel', email: 'sneha@zomatostudio.tv', companyName: 'Zomato Media Productions', phone: '+91 98890 12345' },
      { name: 'Devendra Singhania', email: 'dev@tatadigital.in', companyName: 'Tata Digital Services', phone: '+91 98901 23456' },
      { name: 'Meera Nambiar', email: 'meera@phonepefin.com', companyName: 'PhonePe Payments Hub', phone: '+91 99012 34567' },
      { name: 'Rajesh Nair', email: 'rajesh@makemytripcorp.com', companyName: 'MakeMyTrip Travel Systems', phone: '+91 99123 45678' },
      { name: 'Pooja Bhatia', email: 'pooja@nykaaretail.in', companyName: 'Nykaa Enterprise Labs', phone: '+91 99234 56789' },
      { name: 'Sanjay Deshmukh', email: 'sanjay@pinelabsnet.com', companyName: 'Pine Labs Point Tech', phone: '+91 99345 67890' },
      { name: 'Divya Reddy', email: 'divya@delhiverycargo.co', companyName: 'Delhivery Cargo Logistics', phone: '+91 99456 78901' },
      { name: 'Manish Tiwari', email: 'manish@meeshoretail.in', companyName: 'Meesho Retail Hub', phone: '+91 99567 89012' },
      { name: 'Kavita Sen', email: 'kavita@policybazaarhub.com', companyName: 'PolicyBazaar Insuretech', phone: '+91 99678 90123' },
      { name: 'Amit Saxena', email: 'amit@lenskarttech.com', companyName: 'Lenskart Vision Systems', phone: '+91 99789 01234' },
      { name: 'Ritu Kapoor', email: 'ritu@postmanapis.io', companyName: 'Postman Developer Lab', phone: '+91 99890 12345' },
      { name: 'Sameer Kulkarni', email: 'sameer@freshworkscrm.in', companyName: 'Freshworks CRM Global', phone: '+91 99901 23456' },
      { name: 'Tanvi Agarwal', email: 'tanvi@browserstackqa.com', companyName: 'BrowserStack Cloud QA', phone: '+91 97012 34567' },
      { name: 'Gaurav Das', email: 'gaurav@innov8spaces.com', companyName: 'Innov8 CoWorking Hub', phone: '+91 97123 45678' },
      { name: 'Acme User (Default)', email: 'acme@example.com', companyName: 'Acme Global Corp', phone: '+91 97234 56789' }
    ];

    const customers = [];
    for (const c of customerSeedList) {
      const cust = await User.create({
        name: c.name,
        email: c.email,
        password: 'Customer@12345',
        role: 'Customer',
        companyName: c.companyName,
        phone: c.phone,
        address: {
          street: '101 Cyber Heights, Tech Corridor',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560100',
          country: 'India'
        },
        taxId: `29AAACG${Math.floor(1000 + Math.random() * 9000)}F1Z5`
      });
      customers.push(cust);
    }

    console.log('[Seed] Inserting Products & Variants...');
    // 2. Products with Variants
    const prodOdoo = await Product.create({
      name: 'Enterprise Odoo ERP',
      code: 'PROD-ODOO',
      productType: 'Software',
      salesPrice: 1000,
      costPrice: 500,
      description: 'Comprehensive enterprise business management and ERP software suite.',
      variants: [
        { name: 'Standard Community', sku: 'ODOO-STD', additionalPrice: 0, active: true },
        { name: 'Odoo Enterprise Connector', sku: 'ODOO-ENT-560', additionalPrice: 560, active: true }, // Base 1000 + 560 = 1560
        { name: 'Multi-Tenant High Availability', sku: 'ODOO-HA', additionalPrice: 1100, active: true }
      ]
    });

    const prodCloud = await Product.create({
      name: 'Managed Cloud Infrastructure',
      code: 'PROD-CLOUD',
      productType: 'Service',
      salesPrice: 2000,
      costPrice: 900,
      description: 'Dedicated Kubernetes cluster with auto-scaling and DDoS mitigation.',
      variants: [
        { name: '16GB RAM / 4 vCPU', sku: 'CLOUD-16G', additionalPrice: 500, active: true },
        { name: '32GB RAM / 8 vCPU', sku: 'CLOUD-32G', additionalPrice: 1200, active: true },
        { name: 'GPU Accelerated (NVIDIA A10G)', sku: 'CLOUD-GPU', additionalPrice: 2800, active: true }
      ]
    });

    const prodAI = await Product.create({
      name: 'AI Insights & Analytics Suite',
      code: 'PROD-AI-SUITE',
      productType: 'Software',
      salesPrice: 3500,
      costPrice: 1400,
      description: 'Predictive churn intelligence and automated financial reporting pipeline.',
      variants: [
        { name: '100k API Tokens', sku: 'AI-100K', additionalPrice: 800, active: true },
        { name: 'Unlimited Model Invocations', sku: 'AI-UNLIMITED', additionalPrice: 2500, active: true }
      ]
    });

    const prodVPN = await Product.create({
      name: 'Zero-Trust Secure Gateway & VPN',
      code: 'PROD-VPN-GATE',
      productType: 'Software',
      salesPrice: 800,
      costPrice: 300,
      description: 'Enterprise zero-trust network access with single sign-on integration.',
      variants: [
        { name: 'Dedicated Static IP', sku: 'VPN-STATIC-IP', additionalPrice: 300, active: true },
        { name: 'Multi-Region Failover', sku: 'VPN-MULTI-REG', additionalPrice: 750, active: true }
      ]
    });

    const prodSupport = await Product.create({
      name: '24/7 Dedicated Engineering Support SLA',
      code: 'PROD-SLA-SUPP',
      productType: 'Service',
      salesPrice: 1500,
      costPrice: 400,
      description: 'Guaranteed 15-minute response SLA with dedicated Technical Account Manager.',
      variants: [
        { name: 'Gold Priority (15m SLA)', sku: 'SLA-GOLD', additionalPrice: 1000, active: true },
        { name: 'Platinum Executive TAM', sku: 'SLA-PLATINUM', additionalPrice: 3000, active: true }
      ]
    });

    console.log('[Seed] Inserting Plans...');
    // 3. Plans
    const planMonthly = await Plan.create({
      name: 'Standard Monthly Plan',
      code: 'PLAN-MONTHLY',
      billingFrequency: 'Monthly',
      minimumQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      autoClosureRules: { autoCloseOnExpiry: true, gracePeriodDays: 3 },
      description: 'Standard monthly billing plan with flexible pause and renewal options.'
    });

    const planAnnual = await Plan.create({
      name: 'Annual Enterprise Plan',
      code: 'PLAN-ANNUAL',
      billingFrequency: 'Yearly',
      minimumQuantity: 1,
      allowPause: true,
      allowEarlyClosure: false,
      allowRenewal: true,
      autoClosureRules: { autoCloseOnExpiry: false, gracePeriodDays: 7 },
      description: 'Annual enterprise subscription offering volume discounts and yearly billing.'
    });

    const planWeekly = await Plan.create({
      name: 'Weekly Growth Sprint',
      code: 'PLAN-WEEKLY',
      billingFrequency: 'Weekly',
      minimumQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      description: 'Weekly recurring billing suited for fast iterations and sprint projects.'
    });

    const planDaily = await Plan.create({
      name: 'Daily Sandbox Testing',
      code: 'PLAN-DAILY',
      billingFrequency: 'Daily',
      minimumQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      description: 'Daily billing frequency ideal for quick testing and micro-services demo.'
    });

    console.log('[Seed] Inserting Tax and Discount Rules...');
    // 4. Taxes & Discounts
    const taxGST = await TaxRule.create({
      name: 'Goods & Services Tax (GST 18%)',
      code: 'GST18',
      rate: 18,
      isInclusive: false,
      priority: 1,
      appliesToProductTypes: ['Software', 'Service', 'Physical', 'Addon']
    });

    const taxVAT = await TaxRule.create({
      name: 'Value Added Tax (VAT 5%)',
      code: 'VAT05',
      rate: 5,
      isInclusive: false,
      priority: 2,
      active: false
    });

    const discWelcome = await DiscountRule.create({
      code: 'WELCOME20',
      name: 'New Customer Welcome (20% Off)',
      description: '20% off on all subscriptions above Rs. 1000',
      discountType: 'Percentage',
      value: 20,
      targetType: 'Subscription',
      minPurchaseAmount: 1000,
      usageLimit: 100,
      usedCount: 8
    });

    const discDiwali = await DiscountRule.create({
      code: 'FLAT500',
      name: 'Festive Flat Rs. 500 Discount',
      description: 'Flat Rs. 500 off on subscriptions exceeding Rs. 2000',
      discountType: 'Fixed',
      value: 500,
      targetType: 'Subscription',
      minPurchaseAmount: 2000,
      usageLimit: 50,
      usedCount: 14
    });

    const discAnnual = await DiscountRule.create({
      code: 'ANNUAL15',
      name: 'Annual Subscription Saver (15%)',
      description: '15% off for long term annual contracts',
      discountType: 'Percentage',
      value: 15,
      targetType: 'Subscription',
      minPurchaseAmount: 10000,
      usageLimit: 200,
      usedCount: 22
    });

    console.log('[Seed] Inserting Quotation Templates...');
    // 5. Quotation Template
    await QuotationTemplate.create({
      name: 'Standard SaaS Suite Package',
      description: 'Cloud Infrastructure + Odoo ERP with standard support',
      lines: [
        {
          productId: prodCloud._id,
          variantName: '16GB RAM / 4 vCPU',
          planId: planMonthly._id,
          quantity: 1,
          unitPrice: 2500
        },
        {
          productId: prodOdoo._id,
          variantName: 'Odoo Enterprise Connector',
          planId: planMonthly._id,
          quantity: 1,
          unitPrice: 1560
        }
      ],
      defaultValidityDays: 30,
      termsAndConditions: 'Standard 30-day quotation validity. 18% GST applicable.'
    });

    console.log('[Seed] Inserting Subscriptions...');
    // 6. Subscriptions
    const subscriptions = [];
    const now = new Date();

    // Create 16 Active Subscriptions
    for (let i = 0; i < 16; i++) {
      const cust = customers[i];
      const plan = i % 3 === 0 ? planAnnual : i % 2 === 0 ? planMonthly : planWeekly;
      const isOdoo = i % 2 === 0;

      const lines = isOdoo
        ? [
            {
              productId: prodOdoo._id,
              productName: prodOdoo.name,
              variantName: 'Odoo Enterprise Connector', // 1000 + 560 = 1560
              quantity: 1,
              unitPrice: 1560,
              costPrice: 500,
              lineDiscountAmount: 0,
              taxRate: 18,
              taxAmount: Math.round(1560 * 0.18 * 100) / 100,
              totalAmount: Math.round(1560 * 1.18 * 100) / 100
            }
          ]
        : [
            {
              productId: prodCloud._id,
              productName: prodCloud.name,
              variantName: '16GB RAM / 4 vCPU', // 2000 + 500 = 2500
              quantity: 2,
              unitPrice: 2500,
              costPrice: 900,
              lineDiscountAmount: 0,
              taxRate: 18,
              taxAmount: Math.round(5000 * 0.18 * 100) / 100,
              totalAmount: Math.round(5000 * 1.18 * 100) / 100
            }
          ];

      const subtotal = lines.reduce((s, l) => s + (l.unitPrice * l.quantity), 0);
      const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
      const totalAmount = subtotal + taxAmount;

      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (30 * (i + 1)));

      const nextBillingDate = new Date(now);
      // Give some subscriptions due today or upcoming
      if (i < 4) {
        nextBillingDate.setDate(nextBillingDate.getDate() - (i + 1)); // Due now for billing run demo!
      } else {
        nextBillingDate.setDate(nextBillingDate.getDate() + (i * 3));
      }

      const sub = await Subscription.create({
        subscriptionNumber: `SUB-2026-${String(i + 1).padStart(4, '0')}`,
        customerId: cust._id,
        planId: plan._id,
        lines,
        billingFrequency: plan.billingFrequency,
        startDate,
        expiryDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        nextBillingDate,
        lastBilledDate: new Date(nextBillingDate.getTime() - 30 * 24 * 3600 * 1000),
        paymentTerms: 'Immediate',
        subtotal,
        taxAmount,
        totalAmount,
        status: 'Active',
        notes: `Subscription for ${cust.name}`
      });
      subscriptions.push(sub);
    }

    // 2 Paused Subscriptions
    const pausedSub1 = await Subscription.create({
      subscriptionNumber: 'SUB-2026-0017',
      customerId: customers[16]._id,
      planId: planMonthly._id,
      lines: [
        {
          productId: prodAI._id,
          productName: prodAI.name,
          variantName: '100k API Tokens',
          quantity: 1,
          unitPrice: 4300,
          costPrice: 1400,
          lineDiscountAmount: 0,
          taxRate: 18,
          taxAmount: 774,
          totalAmount: 5074
        }
      ],
      billingFrequency: 'Monthly',
      startDate: new Date(now.getTime() - 60 * 24 * 3600 * 1000),
      nextBillingDate: new Date(now.getTime() + 10 * 24 * 3600 * 1000),
      subtotal: 4300,
      taxAmount: 774,
      totalAmount: 5074,
      status: 'Paused',
      pauseDate: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
      notes: 'Temporarily paused by customer request'
    });
    subscriptions.push(pausedSub1);

    // 2 Expired Subscriptions
    const expiredSub1 = await Subscription.create({
      subscriptionNumber: 'SUB-2026-0018',
      customerId: customers[17]._id,
      planId: planMonthly._id,
      lines: [
        {
          productId: prodVPN._id,
          productName: prodVPN.name,
          variantName: 'Dedicated Static IP',
          quantity: 1,
          unitPrice: 1100,
          costPrice: 300,
          lineDiscountAmount: 0,
          taxRate: 18,
          taxAmount: 198,
          totalAmount: 1298
        }
      ],
      billingFrequency: 'Monthly',
      startDate: new Date(now.getTime() - 120 * 24 * 3600 * 1000),
      expiryDate: new Date(now.getTime() - 10 * 24 * 3600 * 1000),
      nextBillingDate: new Date(now.getTime() - 10 * 24 * 3600 * 1000),
      subtotal: 1100,
      taxAmount: 198,
      totalAmount: 1298,
      status: 'Expired',
      notes: 'Contract term ended'
    });
    subscriptions.push(expiredSub1);

    console.log('[Seed] Inserting Invoices, Payments, and Overdues...');
    // 7. Invoices & Payments
    const invoices = [];

    // Historical Paid Invoices
    for (let j = 0; j < 8; j++) {
      const sub = subscriptions[j];
      const pStart = new Date(now);
      pStart.setMonth(pStart.getMonth() - (j + 1));
      const pEnd = new Date(pStart);
      pEnd.setMonth(pEnd.getMonth() + 1);

      const inv = await Invoice.create({
        invoiceNumber: `INV-2026-${String(j + 1).padStart(4, '0')}`,
        subscriptionId: sub._id,
        customerId: sub.customerId,
        periodStart: pStart,
        periodEnd: pEnd,
        lines: sub.lines,
        subtotal: sub.subtotal,
        totalTax: sub.taxAmount,
        totalAmount: sub.totalAmount,
        amountPaid: sub.totalAmount,
        amountDue: 0,
        dueDate: new Date(pStart.getTime() + 15 * 24 * 3600 * 1000),
        status: 'Paid',
        notes: `Paid invoice for ${sub.subscriptionNumber}`
      });

      // Record successful payment
      await Payment.create({
        paymentNumber: `PAY-2026-${String(j + 1).padStart(4, '0')}`,
        invoiceId: inv._id,
        customerId: sub.customerId,
        amount: inv.totalAmount,
        paymentMethod: j % 2 === 0 ? 'UPI' : 'Bank Transfer',
        transactionReference: `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        paymentDate: new Date(pStart.getTime() + 2 * 24 * 3600 * 1000),
        status: 'Success',
        notes: 'Full payment received'
      });

      invoices.push(inv);
    }

    // Overdue Invoices (DueDate in the past, Confirmed status, amountDue > 0)
    for (let k = 8; k < 11; k++) {
      const sub = subscriptions[k];
      const pStart = new Date(now);
      pStart.setDate(pStart.getDate() - 35);
      const pEnd = new Date(now);
      pEnd.setDate(pEnd.getDate() - 5);

      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() - (10 + (k - 8) * 7)); // Overdue by 10 to 24 days!

      const inv = await Invoice.create({
        invoiceNumber: `INV-2026-${String(k + 1).padStart(4, '0')}`,
        subscriptionId: sub._id,
        customerId: sub.customerId,
        periodStart: pStart,
        periodEnd: pEnd,
        lines: sub.lines,
        subtotal: sub.subtotal,
        totalTax: sub.taxAmount,
        totalAmount: sub.totalAmount,
        amountPaid: 0,
        amountDue: sub.totalAmount,
        dueDate,
        status: 'Confirmed', // Dynamic overdue virtual will evaluate to true!
        notes: 'Overdue invoice pending recovery'
      });

      // Simulate a failed payment attempt on the first overdue invoice to show Smart Recovery!
      if (k === 8) {
        await Payment.create({
          paymentNumber: 'PAY-2026-FAIL01',
          invoiceId: inv._id,
          customerId: sub.customerId,
          amount: inv.totalAmount,
          paymentMethod: 'Card',
          transactionReference: 'TXN_FAILED_INSUFFICIENT_FUNDS',
          status: 'Failed',
          notes: 'Declined: Card limit exceeded'
        });

        await PaymentRecovery.create({
          invoiceId: inv._id,
          customerId: sub.customerId,
          amount: inv.totalAmount,
          attemptCount: 1,
          maxAttempts: 3,
          nextRetryDate: new Date(now.getTime() + 24 * 3600 * 1000),
          lastAttemptDate: new Date(now.getTime() - 24 * 3600 * 1000),
          status: 'In_Progress',
          retryLogs: [
            {
              attemptDate: new Date(now.getTime() - 24 * 3600 * 1000),
              outcome: 'Failed',
              message: 'Card limit exceeded on payment gateway',
              notificationSent: true
            }
          ]
        });
      }

      invoices.push(inv);
    }

    // Partial Payment Invoice (AmountDue > 0)
    const partialSub = subscriptions[11];
    const pStartPart = new Date(now);
    pStartPart.setDate(pStartPart.getDate() - 10);
    const pEndPart = new Date(now);
    pEndPart.setDate(pEndPart.getDate() + 20);

    const partialInv = await Invoice.create({
      invoiceNumber: 'INV-2026-0012',
      subscriptionId: partialSub._id,
      customerId: partialSub.customerId,
      periodStart: pStartPart,
      periodEnd: pEndPart,
      lines: partialSub.lines,
      subtotal: partialSub.subtotal,
      totalTax: partialSub.taxAmount,
      totalAmount: partialSub.totalAmount,
      amountPaid: Math.round(partialSub.totalAmount / 2),
      amountDue: Math.round(partialSub.totalAmount - (partialSub.totalAmount / 2)),
      dueDate: new Date(now.getTime() + 10 * 24 * 3600 * 1000),
      status: 'Confirmed',
      notes: '50% advance partial payment recorded'
    });

    await Payment.create({
      paymentNumber: 'PAY-2026-PART01',
      invoiceId: partialInv._id,
      customerId: partialSub.customerId,
      amount: partialInv.amountPaid,
      paymentMethod: 'UPI',
      transactionReference: 'TXN_PARTIAL_ADVANCE',
      status: 'Success',
      notes: 'Initial 50% partial deposit'
    });
    invoices.push(partialInv);

    console.log('[Seed] Inserting Sample Audit Logs...');
    // 8. Sample Audit Logs
    await AuditLog.create([
      {
        actorId: admin._id,
        actorEmail: admin.email,
        actorName: admin.name,
        actorRole: admin.role,
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'System',
        description: 'NexSub Subscription Management System seeded and configured successfully.'
      },
      {
        actorId: admin._id,
        actorEmail: admin.email,
        actorName: admin.name,
        actorRole: admin.role,
        action: 'PRODUCT_CREATED',
        entityType: 'Product',
        entityId: prodOdoo._id.toString(),
        description: `Created product: ${prodOdoo.name} (${prodOdoo.code}) with Odoo variant (+Rs. 560)`
      },
      {
        actorId: staff1._id,
        actorEmail: staff1.email,
        actorName: staff1.name,
        actorRole: staff1.role,
        action: 'SUBSCRIPTION_ACTIVATED',
        entityType: 'Subscription',
        entityId: subscriptions[0]._id.toString(),
        description: `Staff confirmed subscription ${subscriptions[0].subscriptionNumber}`
      }
    ]);

    // 9. Initial Sequence Numbers
    await SystemSetting.create([
      { key: 'seq_INV_2026', value: 12, description: 'Invoice sequence' },
      { key: 'seq_QT_2026', value: 5, description: 'Quotation sequence' },
      { key: 'seq_SUB_2026', value: 18, description: 'Subscription sequence' },
      { key: 'seq_PAY_2026', value: 10, description: 'Payment sequence' },
      { key: 'seq_BR_2026', value: 1, description: 'Billing run sequence' }
    ]);

    console.log('=======================================================');
    console.log('  Seed completed successfully!');
    console.log('  Admin User:     admin@nexsub.com / Admin@12345');
    console.log('  Staff User:     staff@nexsub.com / Staff@12345');
    console.log('  Customer User:  acme@example.com / Customer@12345');
    console.log('  Customers:      22 accounts');
    console.log('  Subscriptions:  18 (Active, Paused, Expired)');
    console.log('  Invoices:       12 (Paid, Overdue, Partial, Confirmed)');
    console.log('=======================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
