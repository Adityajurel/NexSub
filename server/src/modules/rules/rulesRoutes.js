const express = require('express');
const router = express.Router();
const rulesController = require('./rulesController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

// Tax rules
router.get('/taxes', rulesController.getTaxRules);
router.post('/taxes', authorize('Admin'), rulesController.createTaxRule);
router.put('/taxes/:id', authorize('Admin'), rulesController.updateTaxRule);
router.delete('/taxes/:id', authorize('Admin'), rulesController.deleteTaxRule);

// Discount rules
router.get('/discounts', rulesController.getDiscountRules);
router.post('/discounts', authorize('Admin'), rulesController.createDiscountRule);
router.put('/discounts/:id', authorize('Admin'), rulesController.updateDiscountRule);
router.delete('/discounts/:id', authorize('Admin'), rulesController.deleteDiscountRule);

// Pricing preview & margin guard check
router.post('/pricing/preview', rulesController.previewPricingCalculation);

module.exports = router;
