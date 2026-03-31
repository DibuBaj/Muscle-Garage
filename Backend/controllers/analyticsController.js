const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Get dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Get start and end dates
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 1);
    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
    const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 1);

    console.log('🔍 Fetching analytics data...');
    console.log('Current month:', monthStart.toString(), '-', monthEnd.toString());

    // Total Revenue (All time)
      const subscriptions = await Subscription.find({});
    const orders = await Order.find({});
    const bookings = await Booking.find({});

    console.log('📊 Database counts:', {
      subscriptions: subscriptions.length,
      orders: orders.length,
      bookings: bookings.length,
    });

    // Subscription revenue helper: prefer explicit price if present, else map by totalDays
      const getSubPrice = (sub) => {
        if (typeof sub.price === 'number') return sub.price;
        return getPlanPrice(sub.totalDays);
      };

      const subscriptionRevenueAllTime = subscriptions.reduce((sum, sub) => sum + getSubPrice(sub), 0);
      const orderRevenueAllTime = orders.reduce((sum, order) => sum + (order.orderTotal || 0), 0);
      const bookingRevenueAllTime = bookings.reduce((sum, booking) => {
        if (booking.type === 'trainer') return sum + (booking.trainerRate || 0);
        if (booking.type === 'session') return sum + (booking.sessionRate || 0);
        return sum;
      }, 0);

      const totalRevenue = subscriptionRevenueAllTime + orderRevenueAllTime + bookingRevenueAllTime;

    // This Month Revenue
    let thisMonthSubscriptionRevenue = 0;
    let thisMonthOrderRevenue = 0;
    let thisMonthBookingRevenue = 0;

    const thisMonthSubscriptions = await Subscription.find({
      startDate: { $gte: monthStart, $lt: monthEnd },
    });

    const thisMonthOrders = await Order.find({
      createdAt: { $gte: monthStart, $lt: monthEnd },
    });

    const thisMonthBookings = await Booking.find({
      bookedAt: { $gte: monthStart, $lt: monthEnd },
    });

    thisMonthSubscriptions.forEach((sub) => {
      thisMonthSubscriptionRevenue += getSubPrice(sub);
    });

    thisMonthOrders.forEach((order) => {
      thisMonthOrderRevenue += order.orderTotal;
    });

    thisMonthBookings.forEach((booking) => {
      if (booking.type === 'trainer') {
        thisMonthBookingRevenue += booking.trainerRate || 0;
      } else if (booking.type === 'session') {
        thisMonthBookingRevenue += booking.sessionRate || 0;
      }
    });

    // Last Month Revenue for comparison
    let lastMonthSubscriptionRevenue = 0;
    let lastMonthOrderRevenue = 0;
    let lastMonthBookingRevenue = 0;

    const lastMonthSubscriptions = await Subscription.find({
      startDate: { $gte: lastMonthStart, $lt: lastMonthEnd },
    });

    const lastMonthOrders = await Order.find({
      createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd },
    });

    const lastMonthBookings = await Booking.find({
      bookedAt: { $gte: lastMonthStart, $lt: lastMonthEnd },
    });

    lastMonthSubscriptions.forEach((sub) => {
      lastMonthSubscriptionRevenue += getSubPrice(sub);
    });

    lastMonthOrders.forEach((order) => {
      lastMonthOrderRevenue += order.orderTotal;
    });

    lastMonthBookings.forEach((booking) => {
      if (booking.type === 'trainer') {
        lastMonthBookingRevenue += booking.trainerRate || 0;
      } else if (booking.type === 'session') {
        lastMonthBookingRevenue += booking.sessionRate || 0;
      }
    });

    // New Users this month
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: monthStart, $lt: monthEnd },
    });

    // Count orders this month
    const ordersCountThisMonth = thisMonthOrders.length;

    // Count bookings this month
    const bookingsCountThisMonth = thisMonthBookings.length;

    // Monthly revenue data for chart (last 6 months)
    const monthlyData = await getMonthlyRevenueData();

    // Calculate percent changes
    const subscriptionChange = calculatePercentChange(
      lastMonthSubscriptionRevenue,
      thisMonthSubscriptionRevenue
    );
    const orderChange = calculatePercentChange(lastMonthOrderRevenue, thisMonthOrderRevenue);
    const bookingChange = calculatePercentChange(lastMonthBookingRevenue, thisMonthBookingRevenue);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue),
        thisMonthRevenue: Math.round(
          thisMonthSubscriptionRevenue + thisMonthOrderRevenue + thisMonthBookingRevenue
        ),
        lastMonthRevenue: Math.round(
          lastMonthSubscriptionRevenue + lastMonthOrderRevenue + lastMonthBookingRevenue
        ),
        revenue: {
          subscription: {
            thisMonth: Math.round(thisMonthSubscriptionRevenue),
            lastMonth: Math.round(lastMonthSubscriptionRevenue),
            change: subscriptionChange,
          },
          supplement: {
            thisMonth: Math.round(thisMonthOrderRevenue),
            lastMonth: Math.round(lastMonthOrderRevenue),
            change: orderChange,
          },
          booking: {
            thisMonth: Math.round(thisMonthBookingRevenue),
            lastMonth: Math.round(lastMonthBookingRevenue),
            change: bookingChange,
          },
        },
        counts: {
          newUsers: newUsersThisMonth,
          orders: ordersCountThisMonth,
          bookings: bookingsCountThisMonth,
          subscriptions: subscriptions.length,
        },
        monthlyData,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Helper function to get plan price based on days
function getPlanPrice(totalDays) {
  if (totalDays >= 365) return 17000;
  if (totalDays >= 90) return 4000;
  if (totalDays >= 30) return 1500;
  return 0;
}

// Helper function to calculate percent change
function calculatePercentChange(lastValue, currentValue) {
  if (lastValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }
  return Math.round(((currentValue - lastValue) / lastValue) * 100);
}

// Helper function to get monthly revenue data for last 6 months
async function getMonthlyRevenueData() {
  const data = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });

    const subscriptions = await Subscription.find({
      startDate: { $gte: monthDate, $lt: nextMonthDate },
    });

    const orders = await Order.find({
      createdAt: { $gte: monthDate, $lt: nextMonthDate },
    });

    const bookings = await Booking.find({
      bookedAt: { $gte: monthDate, $lt: nextMonthDate },
    });

    let subscriptionRevenue = 0;
    let orderRevenue = 0;
    let bookingRevenue = 0;

    subscriptions.forEach((sub) => {
      const price = typeof sub.price === 'number' ? sub.price : getPlanPrice(sub.totalDays);
      subscriptionRevenue += price;
    });

    orders.forEach((order) => {
      orderRevenue += order.orderTotal;
    });

    bookings.forEach((booking) => {
      if (booking.type === 'trainer') {
        bookingRevenue += booking.trainerRate || 0;
      } else if (booking.type === 'session') {
        bookingRevenue += booking.sessionRate || 0;
      }
    });

    data.push({
      month: monthName,
      subscription: subscriptionRevenue,
      supplement: orderRevenue,
      booking: bookingRevenue,
      total: subscriptionRevenue + orderRevenue + bookingRevenue,
    });
  }

  return data;
}
