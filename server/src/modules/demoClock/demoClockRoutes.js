const express = require('express');
const router = express.Router();
const demoClockController = require('./demoClockController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

// Everyone can view current simulated date
router.get('/', demoClockController.getStatus);

// Admin & Staff can control Demo Clock
router.post('/set', authorize('Admin', 'Staff'), demoClockController.setDate);
router.post('/advance', authorize('Admin', 'Staff'), demoClockController.advance);
router.post('/reset', authorize('Admin', 'Staff'), demoClockController.reset);
router.post('/run-billing', authorize('Admin', 'Staff'), demoClockController.simulateBillingCycle);

module.exports = router;
