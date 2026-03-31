const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', authMiddleware, adminMiddleware, analyticsController.getDashboardAnalytics);

// Test endpoint with mock data (for development/testing)
router.get('/test', (req, res) => {
  const mockData = {
    totalRevenue: 2750000,
    thisMonthRevenue: 450000,
    lastMonthRevenue: 380000,
    revenue: {
      subscription: {
        thisMonth: 250000,
        lastMonth: 200000,
        change: 25,
      },
      supplement: {
        thisMonth: 150000,
        lastMonth: 120000,
        change: 25,
      },
      booking: {
        thisMonth: 50000,
        lastMonth: 60000,
        change: -17,
      },
    },
    counts: {
      newUsers: 42,
      orders: 87,
      bookings: 23,
      subscriptions: 156,
    },
    monthlyData: [
      { month: 'Sep', subscription: 180000, supplement: 90000, booking: 35000, total: 305000 },
      { month: 'Oct', subscription: 200000, supplement: 100000, booking: 40000, total: 340000 },
      { month: 'Nov', subscription: 220000, supplement: 110000, booking: 42000, total: 372000 },
      { month: 'Dec', subscription: 240000, supplement: 115000, booking: 40000, total: 395000 },
      { month: 'Jan', subscription: 230000, supplement: 120000, booking: 45000, total: 395000 },
      { month: 'Feb', subscription: 250000, supplement: 150000, booking: 50000, total: 450000 },
    ],
  };

  res.status(200).json({
    success: true,
    data: mockData,
  });
});

module.exports = router;
