const Product = require('../../models/Product');
const DiscountRule = require('../../models/DiscountRule');
const TaxRule = require('../../models/TaxRule');
const { getEffectiveDate } = require('../../utils/demoClockService');

/**
 * Calculates complete pricing breakdown, discount application, taxes,
 * margin guard warning, and line-by-line price explainer snapshots.
 */
const calculatePricing = async ({
  lines = [],
  subscriptionDiscountRuleId = null,
  taxRuleIds = [],
  effectiveDate = null
}) => {
  const currentDate = effectiveDate ? new Date(effectiveDate) : getEffectiveDate();

  // Fetch products
  const productIds = lines.map((l) => l.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  // Fetch discount rules
  const discountRuleIds = lines
    .map((l) => l.lineDiscountRuleId)
    .filter(Boolean);
  if (subscriptionDiscountRuleId) {
    discountRuleIds.push(subscriptionDiscountRuleId);
  }
  const discountRules = await DiscountRule.find({ _id: { $in: discountRuleIds }, active: true });
  const discountRuleMap = new Map(discountRules.map((d) => [d._id.toString(), d]));

  // Fetch tax rules
  let taxes = [];
  if (taxRuleIds && taxRuleIds.length > 0) {
    taxes = await TaxRule.find({ _id: { $in: taxRuleIds }, active: true });
  } else {
    // Default active tax rules
    taxes = await TaxRule.find({ active: true });
  }

  const calculatedLines = [];
  let subtotal = 0;
  let totalLineDiscounts = 0;
  let totalCost = 0;
  const marginWarnings = [];

  for (const line of lines) {
    const product = productMap.get(line.productId?.toString());
    if (!product) {
      throw new Error(`Product not found: ${line.productId}`);
    }

    const quantity = Number(line.quantity) || 1;
    const basePrice = Number(product.salesPrice) || 0;
    const costPrice = Number(product.costPrice) || 0;

    // Resolve variant
    let variantPrice = 0;
    let selectedVariant = null;
    if (line.variantName && product.variants?.length > 0) {
      selectedVariant = product.variants.find(
        (v) => v.name.toLowerCase() === line.variantName.toLowerCase() && v.active
      );
      if (selectedVariant) {
        variantPrice = Number(selectedVariant.additionalPrice) || 0;
      }
    }

    const unitPrice = basePrice + variantPrice;
    const grossLineTotal = unitPrice * quantity;
    const lineCost = costPrice * quantity;
    totalCost += lineCost;
    subtotal += grossLineTotal;

    // Line Discount
    let lineDiscountAmount = 0;
    let appliedLineDiscountRule = null;

    if (line.lineDiscountRuleId) {
      const discountRule = discountRuleMap.get(line.lineDiscountRuleId.toString());
      if (discountRule && isDiscountValid(discountRule, currentDate, grossLineTotal, quantity, product._id)) {
        appliedLineDiscountRule = discountRule;
        if (discountRule.discountType === 'Percentage') {
          lineDiscountAmount = (grossLineTotal * discountRule.value) / 100;
        } else {
          lineDiscountAmount = Math.min(discountRule.value, grossLineTotal);
        }
      }
    }

    totalLineDiscounts += lineDiscountAmount;
    const netLineTotal = Math.max(0, grossLineTotal - lineDiscountAmount);

    // Line Margin Check
    if (netLineTotal < lineCost) {
      marginWarnings.push({
        productId: product._id,
        productName: product.name,
        netPrice: netLineTotal,
        cost: lineCost,
        shortfall: lineCost - netLineTotal,
        message: `Line item '${product.name}' selling price (Rs. ${netLineTotal.toFixed(2)}) is below cost (Rs. ${lineCost.toFixed(2)}).`
      });
    }

    // Explainer formula
    let formula = `[Base: Rs. ${basePrice}`;
    if (variantPrice > 0) formula += ` + Variant '${selectedVariant?.name}': Rs. ${variantPrice}`;
    formula += ` = Unit: Rs. ${unitPrice}] x Qty ${quantity} = Gross Rs. ${grossLineTotal}`;
    if (lineDiscountAmount > 0) {
      formula += ` - Line Discount (${appliedLineDiscountRule?.code}): Rs. ${lineDiscountAmount.toFixed(2)}`;
    }
    formula += ` -> Net Rs. ${netLineTotal.toFixed(2)}`;

    calculatedLines.push({
      productId: product._id,
      productName: product.name,
      variantName: selectedVariant?.name || line.variantName || '',
      quantity,
      unitPrice,
      costPrice,
      lineDiscountRuleId: appliedLineDiscountRule?._id || null,
      lineDiscountAmount: Math.round(lineDiscountAmount * 100) / 100,
      taxRate: 0, // Computed below
      taxAmount: 0,
      totalAmount: Math.round(netLineTotal * 100) / 100,
      priceSnapshot: {
        basePrice,
        variantPrice,
        costPrice,
        formula
      }
    });
  }

  // Subscription-level Discount
  const preSubDiscountTotal = Math.max(0, subtotal - totalLineDiscounts);
  let subscriptionDiscountAmount = 0;
  let appliedSubDiscountRule = null;

  if (subscriptionDiscountRuleId) {
    const subRule = discountRuleMap.get(subscriptionDiscountRuleId.toString());
    if (subRule && isDiscountValid(subRule, currentDate, preSubDiscountTotal, 1)) {
      appliedSubDiscountRule = subRule;
      if (subRule.discountType === 'Percentage') {
        subscriptionDiscountAmount = (preSubDiscountTotal * subRule.value) / 100;
      } else {
        subscriptionDiscountAmount = Math.min(subRule.value, preSubDiscountTotal);
      }
    }
  }

  const totalDiscount = totalLineDiscounts + subscriptionDiscountAmount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);

  // Overall Margin Guard Check
  const marginGuardTriggered = taxableAmount < totalCost;
  if (marginGuardTriggered) {
    marginWarnings.push({
      message: `MARGIN GUARD ALERT: Total net selling price (Rs. ${taxableAmount.toFixed(2)}) falls below total cost price (Rs. ${totalCost.toFixed(2)}). Margin shortfall: Rs. ${(totalCost - taxableAmount).toFixed(2)}.`
    });
  }

  // Tax Calculation
  let totalTax = 0;
  const taxBreakdown = [];

  for (const tax of taxes) {
    if (!tax.active) continue;
    const taxAmt = Math.round((taxableAmount * (tax.rate / 100)) * 100) / 100;
    totalTax += taxAmt;
    taxBreakdown.push({
      taxRuleId: tax._id,
      name: tax.name,
      rate: tax.rate,
      amount: taxAmt
    });
  }

  // Proportionally attribute tax to lines for itemized accounting
  const totalTaxRate = taxes.reduce((sum, t) => sum + (t.rate || 0), 0);
  calculatedLines.forEach((line) => {
    line.taxRate = totalTaxRate;
    line.taxAmount = Math.round((line.totalAmount * (totalTaxRate / 100)) * 100) / 100;
    line.totalAmount = Math.round((line.totalAmount + line.taxAmount) * 100) / 100;
  });

  const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

  return {
    lines: calculatedLines,
    subtotal: Math.round(subtotal * 100) / 100,
    lineDiscountsTotal: Math.round(totalLineDiscounts * 100) / 100,
    subscriptionDiscountAmount: Math.round(subscriptionDiscountAmount * 100) / 100,
    appliedSubscriptionDiscountRule: appliedSubDiscountRule,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    taxBreakdown,
    grandTotal,
    totalCost: Math.round(totalCost * 100) / 100,
    marginGuard: {
      alert: marginGuardTriggered,
      marginWarnings,
      totalSellingPrice: taxableAmount,
      totalCost,
      marginShortfall: Math.max(0, totalCost - taxableAmount)
    }
  };
};

const isDiscountValid = (rule, date, amount, quantity, productId = null) => {
  if (!rule.active) return false;
  if (rule.startDate && new Date(rule.startDate) > date) return false;
  if (rule.endDate && new Date(rule.endDate) < date) return false;
  if (rule.usageLimit > 0 && rule.usedCount >= rule.usageLimit) return false;
  if (rule.minPurchaseAmount > 0 && amount < rule.minPurchaseAmount) return false;
  if (rule.minQuantity > 1 && quantity < rule.minQuantity) return false;

  if (productId && rule.applicableProducts?.length > 0) {
    const isApplicable = rule.applicableProducts.some(
      (p) => p.toString() === productId.toString()
    );
    if (!isApplicable) return false;
  }

  return true;
};

module.exports = {
  calculatePricing,
  isDiscountValid
};
