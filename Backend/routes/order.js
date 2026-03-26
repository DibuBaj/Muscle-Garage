const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const { createOrder, getOrders, updateOrderStatus, getUserOrders } = require('../controllers/orderController');

// User routes
router.post('/', createOrder);
router.get('/user/history', getUserOrders);

// Admin routes
router.get('/admin/all', adminMiddleware, getOrders);
router.put('/admin/:orderId/status', adminMiddleware, updateOrderStatus);

module.exports = router;
