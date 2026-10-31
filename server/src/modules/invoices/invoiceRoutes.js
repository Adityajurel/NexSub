const express = require('express');
const router = express.Router();
const invoiceController = require('./invoiceController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.get('/:id/pdf', invoiceController.downloadPDF);

// Staff and Admin actions
router.post('/:id/confirm', authorize('Admin', 'Staff'), invoiceController.confirmInvoice);
router.post('/:id/cancel', authorize('Admin', 'Staff'), invoiceController.cancelInvoice);
router.post('/:id/send', authorize('Admin', 'Staff'), invoiceController.sendInvoiceByEmail);

module.exports = router;
