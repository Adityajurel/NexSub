const express = require('express');
const router = express.Router();
const aiController = require('./aiController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);
router.use(authorize('Admin', 'Staff'));

router.post('/query', aiController.handleQuery);
router.post('/dunning-draft', aiController.handleDunningDraft);

module.exports = router;
