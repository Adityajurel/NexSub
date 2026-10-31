const express = require('express');
const router = express.Router();
const quotationController = require('./quotationController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

// Templates
router.get('/templates', quotationController.getTemplates);
router.post('/templates', authorize('Admin', 'Staff'), quotationController.createTemplate);

// Quotations
router.get('/', quotationController.getQuotations);
router.get('/:id', quotationController.getQuotationById);
router.get('/:id/pdf', quotationController.downloadPDF);
router.post('/', authorize('Admin', 'Staff'), quotationController.createQuotation);
router.put('/:id/status', authorize('Admin', 'Staff'), quotationController.updateQuotationStatus);
router.post('/:id/convert', authorize('Admin', 'Staff'), quotationController.convertToSubscription);

module.exports = router;
