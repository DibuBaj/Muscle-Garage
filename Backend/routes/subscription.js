const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getUserSubscription,
  subscribe,
  pauseSubscription,
  resumeSubscription,
} = require('../controllers/subscriptionController');

const router = express.Router();

// Get user's subscription
router.get('/me', authMiddleware, getUserSubscription);

// Subscribe to a plan
router.post('/subscribe', authMiddleware, subscribe);

// Pause subscription
router.post('/pause', authMiddleware, pauseSubscription);

// Resume subscription
router.post('/resume', authMiddleware, resumeSubscription);

module.exports = router;
