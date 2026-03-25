const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const { createOrder, getOrders, updateOrderStatus } = require('../controllers/orderController');

// Public (place order)
router.post('/', createOrder);

// Admin
router.get('/admin/all', adminMiddleware, getOrders);
router.put('/admin/:orderId/status', adminMiddleware, updateOrderStatus);

module.exports = router;
