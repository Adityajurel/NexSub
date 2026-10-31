const express = require('express');
const router = express.Router();
const auditController = require('./auditController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);
router.use(authorize('Admin')); // Audit logs strictly restricted to Admin

router.get('/', auditController.getAuditLogs);

module.exports = router;
