const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscriptionController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

router.get('/', subscriptionController.getSubscriptions);
router.get('/:id', subscriptionController.getSubscriptionById);
router.post('/', authorize('Admin', 'Staff'), subscriptionController.createSubscription);

// State transitions (Customer can pause/resume/close if plan allows)
router.post('/:id/pause', subscriptionController.pauseSubscription);
router.post('/:id/resume', subscriptionController.resumeSubscription);
router.post('/:id/renew', authorize('Admin', 'Staff'), subscriptionController.renewSubscription);
router.post('/:id/close', subscriptionController.closeSubscription);

module.exports = router;
