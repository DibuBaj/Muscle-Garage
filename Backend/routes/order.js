const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const {
	createOrder,
	initiateKhaltiOrder,
	completeKhaltiOrder,
	getOrders,
	updateOrderStatus,
	getUserOrders,
} = require('../controllers/orderController');

// User routes
router.post('/', createOrder);
router.post('/khalti/initiate', initiateKhaltiOrder);
router.post('/khalti/complete', completeKhaltiOrder);
router.get('/user/history', getUserOrders);

// Admin routes
router.get('/admin/all', adminMiddleware, getOrders);
router.put('/admin/:orderId/status', adminMiddleware, updateOrderStatus);

module.exports = router;
