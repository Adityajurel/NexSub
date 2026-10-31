const express = require('express');
const router = express.Router();
const reportsController = require('./reportsController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);
router.use(authorize('Admin', 'Staff'));

router.get('/overview', reportsController.getDashboardOverview);
router.get('/financials', reportsController.getDetailedFinancialReport);
router.get('/export-csv', reportsController.exportFinancialsCSV);

module.exports = router;
