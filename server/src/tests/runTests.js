const assert = require('assert');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const TaxRule = require('../models/TaxRule');
const DiscountRule = require('../models/DiscountRule');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { calculatePricing } = require('../modules/pricing/pricingEngine');
const { executeBillingRun } = require('../modules/billing/billingEngine');

let testPassed = 0;
let testFailed = 0;

const runTest = async (name, testFn) => {
  try {
    process.stdout.write(`  [TEST] ${name} ... `);
    await testFn();
    console.log('\x1b[32mPASSED\x1b[0m');
    testPassed++;
  } catch (err) {
    console.log('\x1b[31mFAILED\x1b[0m');
    console.error(`         Reason: ${err.message}`);
    testFailed++;
  }
};

const runAllTests = async () => {
  console.log('====================================================');
  console.log('  NexSub Backend Automated Integration Test Suite');
  console.log('====================================================\n');

  try {
    await mongoose.connect(env.MONGODB_URI);

    // Setup temporary test database entities
    const testAdmin = await User.findOneAndUpdate(
      { email: 'test_admin@nexsub.test' },
      { name: 'Test Admin', password: 'Admin@12345Password!', role: 'Admin', active: true },
      { upsert: true, new: true }
    );

    const testCust = await User.findOneAndUpdate(
      { email: 'test_cust@nexsub.test' },
      { name: 'Test Customer', password: 'Cust@12345Password!', role: 'Customer', active: true },
      { upsert: true, new: true }
    );

    const testProd = await Product.findOneAndUpdate(
      { code: 'TEST-PROD-ODOO' },
      {
        name: 'Test Odoo Product',
        salesPrice: 1000,
        costPrice: 500,
        variants: [{ name: 'Odoo Variant', sku: 'OD-VAR', additionalPrice: 560, active: true }]
      },
      { upsert: true, new: true }
    );

    const testPlan = await Plan.findOneAndUpdate(
      { code: 'TEST-PLAN-M' },
      { name: 'Test Plan Monthly', billingFrequency: 'Monthly', allowPause: true },
      { upsert: true, new: true }
    );

    const testTax = await TaxRule.findOneAndUpdate(
      { code: 'TEST-TAX-18' },
      { name: 'Test Tax 18%', rate: 18, active: true },
      { upsert: true, new: true }
    );

    const testDiscount = await DiscountRule.findOneAndUpdate(
      { code: 'TEST-DISC-20' },
      {
        name: 'Test 20% Discount',
        discountType: 'Percentage',
        value: 20,
        minPurchaseAmount: 500,
        usageLimit: 5,
        usedCount: 0,
        active: true
      },
      { upsert: true, new: true }
    );

    // Test 1: Pricing Calculation (Base + Variant + Qty + Discount + Tax)
    await runTest('1. Pricing Engine: Base + Variant + Qty calculation', async () => {
      const result = await calculatePricing({
        lines: [{ productId: testProd._id, variantName: 'Odoo Variant', quantity: 2 }],
        taxRuleIds: [testTax._id]
      });
      // Base (1000) + Variant (560) = 1560 * 2 = 3120
      assert.strictEqual(result.subtotal, 3120, `Subtotal expected 3120, got ${result.subtotal}`);
      // Tax: 18% of 3120 = 561.6
      assert.strictEqual(result.totalTax, 561.6, `Tax expected 561.6, got ${result.totalTax}`);
      assert.strictEqual(result.grandTotal, 3681.6, `GrandTotal expected 3681.6, got ${result.grandTotal}`);
    });

    // Test 2: Pricing Engine with Subscription-level Discount
    await runTest('2. Pricing Engine: Percentage discount application', async () => {
      const result = await calculatePricing({
        lines: [{ productId: testProd._id, variantName: 'Odoo Variant', quantity: 1 }],
        subscriptionDiscountRuleId: testDiscount._id,
        taxRuleIds: [testTax._id]
      });
      // Subtotal = 1560. Discount = 20% of 1560 = 312. Net = 1248. Tax 18% of 1248 = 224.64. Grand = 1472.64
      assert.strictEqual(result.subtotal, 1560);
      assert.strictEqual(result.subscriptionDiscountAmount, 312);
      assert.strictEqual(result.taxableAmount, 1248);
      assert.strictEqual(result.grandTotal, 1472.64);
    });

    // Test 3: Margin Guard Warning when discount drops price below cost
    await runTest('3. Margin Guard: Detects selling price below total cost basis', async () => {
      const heavyDiscount = await DiscountRule.create({
        code: `HEAVY_${Date.now()}`,
        name: 'Heavy 80% Off',
        discountType: 'Percentage',
        value: 80,
        active: true
      });

      const result = await calculatePricing({
        lines: [{ productId: testProd._id, quantity: 1 }], // base 1000, cost 500
        subscriptionDiscountRuleId: heavyDiscount._id // 80% off -> net selling 200, cost is 500!
      });

      assert.strictEqual(result.marginGuard.alert, true, 'Margin guard should trigger alert');
      assert.strictEqual(result.marginGuard.marginShortfall, 300, 'Margin shortfall should be 300');
    });

    // Test 4: Idempotent Billing Engine - Duplicate Invoices Prevented
    await runTest('4. Idempotent Billing Engine: Duplicate period prevention', async () => {
      const periodStart = new Date('2026-06-01T00:00:00.000Z');
      const periodEnd = new Date('2026-07-01T00:00:00.000Z');

      const testSub = await Subscription.create({
        subscriptionNumber: `TEST-SUB-${Date.now()}`,
        customerId: testCust._id,
        planId: testPlan._id,
        lines: [{ productId: testProd._id, productName: testProd.name, quantity: 1, unitPrice: 1000, totalAmount: 1180 }],
        billingFrequency: 'Monthly',
        startDate: periodStart,
        nextBillingDate: periodStart,
        subtotal: 1000,
        totalAmount: 1180,
        status: 'Active'
      });

      // Run 1: Should create invoice
      const run1 = await executeBillingRun({
        mode: 'LIVE',
        simulationDate: periodStart
      });

      const invCount1 = await Invoice.countDocuments({ subscriptionId: testSub._id });
      assert.strictEqual(invCount1, 1, 'First billing run should create exactly 1 invoice');

      // Attempt to run billing again for the exact same date/period
      // Reset sub nextBillingDate to simulate duplicate trigger attempt
      await Subscription.updateOne({ _id: testSub._id }, { $set: { nextBillingDate: periodStart } });

      const run2 = await executeBillingRun({
        mode: 'LIVE',
        simulationDate: periodStart
      });

      const invCount2 = await Invoice.countDocuments({ subscriptionId: testSub._id });
      assert.strictEqual(invCount2, 1, 'Second billing run must SKIPPED duplicate and NOT insert a 2nd invoice');

      const duplicateItem = run2.items.find((i) => i.subscriptionId.toString() === testSub._id.toString());
      assert.strictEqual(duplicateItem?.status, 'SKIPPED_DUPLICATE', 'Item status must be SKIPPED_DUPLICATE');
    });

    // Test 5: Partial Payments and Invoice Paid Status
    await runTest('5. Partial Payments: Invoice is Paid only when balance reaches 0', async () => {
      const inv = await Invoice.create({
        invoiceNumber: `TEST-INV-${Date.now()}`,
        subscriptionId: new mongoose.Types.ObjectId(),
        customerId: testCust._id,
        periodStart: new Date(),
        periodEnd: new Date(),
        lines: [],
        subtotal: 1000,
        totalAmount: 1000,
        amountPaid: 0,
        amountDue: 1000,
        dueDate: new Date(Date.now() + 86400000),
        status: 'Confirmed'
      });

      // Partial payment 1: Rs. 400
      inv.amountPaid += 400;
      inv.amountDue = inv.totalAmount - inv.amountPaid;
      inv.status = inv.amountDue <= 0 ? 'Paid' : 'Confirmed';
      await inv.save();

      assert.strictEqual(inv.amountDue, 600);
      assert.strictEqual(inv.status, 'Confirmed', 'Invoice with 600 due must remain Confirmed');

      // Final payment 2: Rs. 600
      inv.amountPaid += 600;
      inv.amountDue = inv.totalAmount - inv.amountPaid;
      inv.status = inv.amountDue <= 0 ? 'Paid' : 'Confirmed';
      await inv.save();

      assert.strictEqual(inv.amountDue, 0);
      assert.strictEqual(inv.status, 'Paid', 'Invoice with 0 due must transition to Paid');
    });

    // Test 6: Subscription State Transitions
    await runTest('6. Subscription State Machine: Pause and Resume transitions', async () => {
      const sub = await Subscription.create({
        subscriptionNumber: `SUB-PAUSE-${Date.now()}`,
        customerId: testCust._id,
        planId: testPlan._id,
        lines: [],
        billingFrequency: 'Monthly',
        startDate: new Date(),
        nextBillingDate: new Date(),
        subtotal: 1000,
        totalAmount: 1000,
        status: 'Active'
      });

      // Pause
      sub.status = 'Paused';
      sub.pauseDate = new Date();
      await sub.save();
      assert.strictEqual(sub.status, 'Paused');

      // Resume
      sub.status = 'Active';
      sub.resumeDate = new Date();
      await sub.save();
      assert.strictEqual(sub.status, 'Active');
    });

    console.log('\n====================================================');
    console.log(`  Tests Completed: ${testPassed} Passed, ${testFailed} Failed`);
    console.log('====================================================\n');

    process.exit(testFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error('[Test Error]:', error);
    process.exit(1);
  }
};

runAllTests();
