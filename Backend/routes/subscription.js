const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  getUserSubscription,
  subscribe,
  initiateKhaltiSubscription,
  completeKhaltiSubscription,
  pauseSubscription,
  resumeSubscription,
  adminPauseSubscription,
  adminSetSubscription,
  adminResumeSubscription,
  getAllPlans,
  getAllPlansAdmin,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  updatePlanOrder,
} = require('../controllers/subscriptionController');

const router = express.Router();

// =====================================================
// USER SUBSCRIPTION ROUTES
// =====================================================

// Get user's subscription
router.get('/me', authMiddleware, getUserSubscription);

// Subscribe to a plan
router.post('/subscribe', authMiddleware, subscribe);

// Khalti payment flow for subscriptions
router.post('/khalti/initiate', authMiddleware, initiateKhaltiSubscription);
router.post('/khalti/complete', authMiddleware, completeKhaltiSubscription);

// Pause subscription
router.post('/pause', authMiddleware, pauseSubscription);

// Resume subscription
router.post('/resume', authMiddleware, resumeSubscription);

// =====================================================
// SUBSCRIPTION PLAN ROUTES (PUBLIC & ADMIN)
// =====================================================

// Get all active subscription plans (public)
router.get('/plans/active', getAllPlans);

// Get all subscription plans (admin only)
router.get('/admin/plans', adminMiddleware, getAllPlansAdmin);

// Create new subscription plan (admin only)
router.post('/admin/plans', adminMiddleware, createPlan);

// Update subscription plan order (admin only)
router.put('/admin/plans/order', adminMiddleware, updatePlanOrder);

// Update subscription plan (admin only)
router.put('/admin/plans/:planId', adminMiddleware, updatePlan);

// Get single plan by ID
router.get('/admin/plans/:planId', adminMiddleware, getPlanById);


// Delete subscription plan (admin only)
router.delete('/admin/plans/:planId', adminMiddleware, deletePlan);

// =====================================================
// ADMIN SUBSCRIPTION MANAGEMENT ROUTES
// =====================================================

// Admin get user subscription with calculated daysLeft
router.get('/admin/get/:userId', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const Subscription = require('../models/Subscription');
    const subscription = await Subscription.findOne({ user: userId });
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found' });
    }

    // Calculate daysLeft dynamically using same logic as controller
    const calculateDaysLeft = (sub) => {
      if (!sub.startDate || !sub.endDate) {
        return 0;
      }
      const now = new Date();
      const startDate = sub.startDate instanceof Date ? sub.startDate : new Date(sub.startDate);
      const dayMs = 1000 * 60 * 60 * 24;

      const totalDays = Number.isFinite(sub.totalDays)
        ? sub.totalDays
        : Math.ceil((new Date(sub.endDate).getTime() - startDate.getTime()) / dayMs);
      if (totalDays <= 0) return 0;

      const elapsedDays = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / dayMs));

      let pausedDays = 0;
      if (sub.pauseInfo?.pauseStartDate && sub.pauseInfo?.pauseEndDate) {
        const pauseStart = new Date(sub.pauseInfo.pauseStartDate);
        const pauseEnd = new Date(sub.pauseInfo.pauseEndDate);

        if (pauseEnd > pauseStart && now > pauseStart) {
          const pausedUntil = now < pauseEnd ? now : pauseEnd;
          pausedDays = Math.ceil((pausedUntil.getTime() - pauseStart.getTime()) / dayMs);
        }
      }

      const activeElapsedDays = Math.max(0, elapsedDays - pausedDays);
      const daysLeft = totalDays - activeElapsedDays;
      return Math.max(0, daysLeft);
    };

    const daysLeft = calculateDaysLeft(subscription);
    res.json({ 
      success: true, 
      subscription: {
        ...subscription.toObject(),
        daysLeft
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to get subscription' });
  }
});

router.post('/admin/pause/:userId', adminMiddleware, adminPauseSubscription);
router.post('/admin/resume/:userId', adminMiddleware, adminResumeSubscription);
router.post('/admin/set/:userId', adminMiddleware, adminSetSubscription);

module.exports = router;
