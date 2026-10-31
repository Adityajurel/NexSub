const express = require('express');
const router = express.Router();
const catalogController = require('./catalogController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

// Public/authenticated read for products and plans (Customer portal needs to see available plans and products)
router.get('/products', authenticate, catalogController.getProducts);
router.get('/products/:id', authenticate, catalogController.getProductById);

router.get('/plans', authenticate, catalogController.getPlans);
router.get('/plans/:id', authenticate, catalogController.getPlanById);

// Admin only write
router.post('/products', authenticate, authorize('Admin'), catalogController.createProduct);
router.put('/products/:id', authenticate, authorize('Admin'), catalogController.updateProduct);
router.delete('/products/:id', authenticate, authorize('Admin'), catalogController.deleteProduct);

router.post('/plans', authenticate, authorize('Admin'), catalogController.createPlan);
router.put('/plans/:id', authenticate, authorize('Admin'), catalogController.updatePlan);
router.delete('/plans/:id', authenticate, authorize('Admin'), catalogController.deletePlan);

module.exports = router;
