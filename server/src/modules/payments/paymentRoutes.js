const express = require('express');
const router = express.Router();
const paymentController = require('./paymentController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

router.get('/', paymentController.getPayments);
// Admin & Staff can record manual payment; Customers can pay their invoices online
router.post('/record', paymentController.recordPayment);
router.post('/razorpay/create-order', paymentController.createRazorpayOrder);
router.post('/razorpay/order', paymentController.createRazorpayOrder);
router.post('/razorpay/verify', paymentController.verifyRazorpayPayment);

module.exports = router;
