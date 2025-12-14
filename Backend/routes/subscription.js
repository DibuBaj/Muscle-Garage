const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getUserSubscription,
  subscribe,
} = require('../controllers/subscriptionController');

const router = express.Router();

// Get user's subscription
router.get('/me', authMiddleware, getUserSubscription);

// Subscribe to a plan
router.post('/subscribe', authMiddleware, subscribe);

module.exports = router;
