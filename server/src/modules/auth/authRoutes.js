const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Only Admin can create staff accounts
router.post('/create-staff', authenticate, authorize('Admin'), authController.createStaff);

module.exports = router;
