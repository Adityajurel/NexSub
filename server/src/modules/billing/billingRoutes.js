const express = require('express');
const router = express.Router();
const billingController = require('./billingController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);
router.use(authorize('Admin', 'Staff'));

router.post('/run', billingController.triggerBillingRun);
router.get('/runs', billingController.getBillingRuns);
router.get('/runs/:id', billingController.getBillingRunDetails);
router.get('/preview', billingController.previewUpcomingBilling);

module.exports = router;
