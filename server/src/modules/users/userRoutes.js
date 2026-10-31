const express = require('express');
const router = express.Router();
const userController = require('./userController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

// Staff and Admin can view customers
router.get('/customers', authorize('Admin', 'Staff'), userController.getCustomers);
router.get('/staff', authorize('Admin'), userController.getStaff);
router.get('/:id', authorize('Admin', 'Staff'), userController.getUserById);
router.put('/:id', authorize('Admin'), userController.updateUser);

module.exports = router;
