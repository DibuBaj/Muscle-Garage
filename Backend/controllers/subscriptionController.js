const Subscription = require('../models/Subscription');
const User = require('../models/User');

const SUBSCRIPTION_PLANS = {
  '1_month': {
    days: 30,
    price: 1500,
  },
  '3_months': {
    days: 90,
    price: 4000,
  },
  '12_months': {
    days: 365,
    price: 17000,
  },
};

/**
 * Calculate days left considering:
 * - Subscription start and end dates
 * - Pause periods (days are not counted during pause)
 * - Current date
 */
const calculateDaysLeft = (subscription) => {
  if (!subscription.startDate || !subscription.endDate) {
    return 0;
  }

  // Ensure dates are proper Date objects
  const now = new Date();
  const startDate = subscription.startDate instanceof Date ? subscription.startDate : new Date(subscription.startDate);

  const dayMs = 1000 * 60 * 60 * 24;
  const totalDays = Number.isFinite(subscription.totalDays)
    ? subscription.totalDays
    : Math.ceil((new Date(subscription.endDate).getTime() - startDate.getTime()) / dayMs);

  if (totalDays <= 0) {
    return 0;
  }

  const elapsedDays = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / dayMs));

  let pausedDays = 0;
  if (subscription.pauseInfo?.pauseStartDate && subscription.pauseInfo?.pauseEndDate) {
    const pauseStart = new Date(subscription.pauseInfo.pauseStartDate);
    const pauseEnd = new Date(subscription.pauseInfo.pauseEndDate);

    if (pauseEnd > pauseStart && now > pauseStart) {
      const pausedUntil = now < pauseEnd ? now : pauseEnd;
      pausedDays = Math.ceil((pausedUntil.getTime() - pauseStart.getTime()) / dayMs);
    }
  }

  const activeElapsedDays = Math.max(0, elapsedDays - pausedDays);
  const daysLeft = totalDays - activeElapsedDays;
  return Math.max(0, daysLeft);
};

exports.getUserSubscription = async (req, res) => {
  try {
    const userId = req.user;

    let subscription = await Subscription.findOne({ user: userId });

    // Create default subscription if doesn't exist
    if (!subscription) {
      try {
        subscription = new Subscription({
          user: userId,
          totalDays: 0,
          daysLeft: 0,
          hasSubscribedBefore: false,
        });
        await subscription.save();
      } catch (saveErr) {
        // If save fails due to duplicate, try to fetch again
        if (saveErr.code === 11000) {
          subscription = await Subscription.findOne({ user: userId });
          if (!subscription) {
            throw saveErr;
          }
        } else {
          throw saveErr;
        }
      }
    }

    // Calculate current days left
    const daysLeft = calculateDaysLeft(subscription);

    res.status(200).json({
      success: true,
      subscription: {
        _id: subscription._id,
        membershipId: subscription.membershipId || null,
        totalDays: subscription.totalDays,
        daysLeft: daysLeft,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        hasSubscribedBefore: subscription.hasSubscribedBefore,
        status: subscription.status,
        pauseInfo: subscription.pauseInfo,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
};

exports.subscribe = async (req, res) => {
  try {
    const userId = req.user;
    const { plan } = req.body;

    // Validate plan
    if (!SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      subscription = new Subscription({ user: userId });
    }

    // Get plan details
    const planDetails = SUBSCRIPTION_PLANS[plan];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDetails.days);

    // Update subscription
    subscription.totalDays = planDetails.days;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.hasSubscribedBefore = true;
    subscription.status = 'active';
    subscription.pauseInfo = {
      pauseStartDate: null,
      pauseEndDate: null,
      lastPauseDate: null,
    };

    await subscription.save();

    const calculatedDaysLeft = calculateDaysLeft(subscription);

    res.status(200).json({
      success: true,
      message: 'Subscription successful',
      subscription: {
        _id: subscription._id,
        membershipId: subscription.membershipId,
        totalDays: subscription.totalDays,
        daysLeft: calculatedDaysLeft,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        hasSubscribedBefore: subscription.hasSubscribedBefore,
        status: subscription.status,
        pauseInfo: subscription.pauseInfo,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe',
    });
  }
};

exports.decreaseDaysDaily = async () => {
  try {
    // This function is now optional as daysLeft is calculated dynamically
    // based on startDate, endDate, and pause periods.
    // Days are automatically counted down based on date comparison.
    console.log('Daily subscription check executed - daysLeft is calculated dynamically');
  } catch (err) {
    console.error('Cron job error:', err);
  }
};

exports.pauseSubscription = async (req, res) => {
  try {
    const userId = req.user;
    const { pauseStartDate, pauseEndDate } = req.body;

    // Validate dates
    if (!pauseStartDate || !pauseEndDate) {
      return res.status(400).json({ success: false, message: 'Pause dates are required' });
    }

    const startDate = new Date(pauseStartDate);
    const endDate = new Date(pauseEndDate);

    // Check date range (1-7 days)
    const daysDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < 1 || daysDifference > 7) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pause duration must be between 1 and 7 days' 
      });
    }

    // Find subscription
    const subscription = await Subscription.findOne({ user: userId });
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Subscription not found' });
    }

    // Check if subscription is active
    const daysLeft = calculateDaysLeft(subscription);
    if (daysLeft <= 0) {
      return res.status(400).json({ success: false, message: 'No active subscription to pause' });
    }

    // Check if pause was used in the last 30 days
    if (subscription.pauseInfo && subscription.pauseInfo.lastPauseDate) {
      const lastPauseDate = new Date(subscription.pauseInfo.lastPauseDate);
      const daysSinceLastPause = Math.floor((new Date() - lastPauseDate) / (1000 * 60 * 60 * 24));
      if (daysSinceLastPause < 30) {
        return res.status(400).json({ 
          success: false, 
          message: `Pause can only be used once per month. Last used ${daysSinceLastPause} days ago. Please contact gym administration for longer pauses.` 
        });
      }
    }

    // Extend end date based on pause duration
    const currentEndDate = new Date(subscription.endDate);
    currentEndDate.setDate(currentEndDate.getDate() + daysDifference);

    // Update subscription
    subscription.status = 'pause';
    subscription.pauseInfo.pauseStartDate = startDate;
    subscription.pauseInfo.pauseEndDate = endDate;
    subscription.pauseInfo.lastPauseDate = new Date();
    subscription.endDate = currentEndDate; // Extend subscription end date by pause duration

    await subscription.save();

    const calculatedDaysLeft = calculateDaysLeft(subscription);

    res.status(200).json({
      success: true,
      message: 'Subscription paused successfully',
      subscription: {
        _id: subscription._id,
        membershipId: subscription.membershipId,
        totalDays: subscription.totalDays,
        daysLeft: calculatedDaysLeft,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        hasSubscribedBefore: subscription.hasSubscribedBefore,
        status: subscription.status,
        pauseInfo: subscription.pauseInfo,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });
  } catch (err) {
    console.error('Pause subscription error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to pause subscription' });
  }
};

exports.resumeSubscription = async (req, res) => {
  try {
    const userId = req.user;
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Subscription not found' });
    }

    if (subscription.status !== 'pause') {
      return res.status(400).json({ success: false, message: 'Subscription is not paused' });
    }

    // If resuming before pause end, remove unused pause days from endDate
    if (subscription.pauseInfo?.pauseEndDate) {
      const now = new Date();
      const pauseStart = subscription.pauseInfo.pauseStartDate
        ? new Date(subscription.pauseInfo.pauseStartDate)
        : null;
      const pauseEnd = new Date(subscription.pauseInfo.pauseEndDate);

      if (now < pauseEnd) {
        const dayMs = 1000 * 60 * 60 * 24;
        const effectiveStart = pauseStart && now < pauseStart ? pauseStart : now;
        const unusedDays = Math.ceil((pauseEnd.getTime() - effectiveStart.getTime()) / dayMs);
        const currentEndDate = new Date(subscription.endDate);
        currentEndDate.setDate(currentEndDate.getDate() - unusedDays);
        subscription.endDate = currentEndDate;
      }
    }

    subscription.status = 'active';
    subscription.pauseInfo.pauseStartDate = null;
    subscription.pauseInfo.pauseEndDate = null;

    await subscription.save();

    const calculatedDaysLeft = calculateDaysLeft(subscription);

    res.status(200).json({
      success: true,
      message: 'Subscription resumed',
      subscription: {
        _id: subscription._id,
        membershipId: subscription.membershipId,
        totalDays: subscription.totalDays,
        daysLeft: calculatedDaysLeft,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        hasSubscribedBefore: subscription.hasSubscribedBefore,
        status: subscription.status,
        pauseInfo: subscription.pauseInfo,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });
  } catch (err) {
    console.error('Resume subscription error:', err);
    res.status(500).json({ success: false, message: 'Failed to resume subscription' });
  }
};

// Admin: Pause subscription for any user with custom dates
exports.adminPauseSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Subscription not found for this user' });
    }

    // Calculate pause duration and extend subscription end date
    const pauseDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const currentEndDate = new Date(subscription.endDate);
    currentEndDate.setDate(currentEndDate.getDate() + pauseDuration);

    subscription.status = 'pause';
    subscription.pauseInfo = {
      pauseStartDate: start,
      pauseEndDate: end,
      lastPauseDate: subscription.pauseInfo?.lastPauseDate || null,
    };
    subscription.endDate = currentEndDate; // Extend subscription end date by pause duration

    await subscription.save();

    const calculatedDaysLeft = calculateDaysLeft(subscription);

    res.status(200).json({
      success: true,
      message: 'Subscription paused successfully by admin',
      subscription: {
        _id: subscription._id,
        membershipId: subscription.membershipId,
        totalDays: subscription.totalDays,
        daysLeft: calculatedDaysLeft,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        pauseInfo: subscription.pauseInfo,
      },
    });
  } catch (err) {
    console.error('Admin pause subscription error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to pause subscription' });
  }
};

// Admin: Set or renew subscription for any user
exports.adminSetSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan, totalDays } = req.body;

    // Derive days from plan if provided; otherwise use totalDays
    let days = undefined;
    if (plan) {
      const planDetails = SUBSCRIPTION_PLANS[plan];
      if (!planDetails) {
        return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
      }
      days = planDetails.days;
    } else if (typeof totalDays !== 'undefined') {
      const parsed = parseInt(totalDays);
      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({ success: false, message: 'Total days must be a positive number' });
      }
      days = parsed;
    } else {
      return res.status(400).json({ success: false, message: 'Provide a valid plan or totalDays' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    let subscription = await Subscription.findOne({ user: userId });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    if (subscription) {
      // Update existing subscription (keep existing membershipId or let pre-save handle if null)
      subscription.totalDays = days;
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.status = 'active';
      subscription.hasSubscribedBefore = true;
      subscription.pauseInfo = {
        pauseStartDate: null,
        pauseEndDate: null,
        lastPauseDate: null,
      };
    } else {
      // Create new subscription
      subscription = new Subscription({
        user: userId,
        totalDays: days,
        startDate,
        endDate,
        status: 'active',
        hasSubscribedBefore: true,
      });
    }

    await subscription.save();

    const calculatedDaysLeft = calculateDaysLeft(subscription);

    res.status(200).json({
      success: true,
      message: 'Subscription set successfully by admin',
      subscription: {
        _id: subscription._id,
        membershipId: subscription.membershipId,
        totalDays: subscription.totalDays,
        daysLeft: calculatedDaysLeft,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        pauseInfo: subscription.pauseInfo,
      },
    });
  } catch (err) {
    console.error('Admin set subscription error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to set subscription' });
  }
};

// Admin: Resume paused subscription for any user
exports.adminResumeSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Subscription not found' });
    }

    if (subscription.status !== 'pause') {
      return res.status(400).json({ success: false, message: 'Subscription is not paused' });
    }

    // If resuming before pause end, remove unused pause days from endDate
    if (subscription.pauseInfo?.pauseEndDate) {
      const now = new Date();
      const pauseEnd = new Date(subscription.pauseInfo.pauseEndDate);
      if (now < pauseEnd) {
        const unusedDays = Math.ceil((pauseEnd - now) / (1000 * 60 * 60 * 24));
        const currentEndDate = new Date(subscription.endDate);
        currentEndDate.setDate(currentEndDate.getDate() - unusedDays);
        subscription.endDate = currentEndDate;
      }
    }

    // If resuming before pause end, remove unused pause days from endDate
    if (subscription.pauseInfo?.pauseEndDate) {
      const now = new Date();
      const pauseStart = subscription.pauseInfo.pauseStartDate
        ? new Date(subscription.pauseInfo.pauseStartDate)
        : null;
      const pauseEnd = new Date(subscription.pauseInfo.pauseEndDate);

      if (now < pauseEnd) {
        const dayMs = 1000 * 60 * 60 * 24;
        const effectiveStart = pauseStart && now < pauseStart ? pauseStart : now;
        const unusedDays = Math.ceil((pauseEnd.getTime() - effectiveStart.getTime()) / dayMs);
        const currentEndDate = new Date(subscription.endDate);
        currentEndDate.setDate(currentEndDate.getDate() - unusedDays);
        subscription.endDate = currentEndDate;
      }
    }

    subscription.status = 'active';
    subscription.pauseInfo = {
      pauseStartDate: null,
      pauseEndDate: null,
      lastPauseDate: subscription.pauseInfo?.lastPauseDate || null,
    };
    await subscription.save();

    const calculatedDaysLeft = calculateDaysLeft(subscription);

    res.status(200).json({
      success: true,
      message: 'Subscription resumed successfully by admin',
      subscription: {
        _id: subscription._id,
        membershipId: subscription.membershipId,
        totalDays: subscription.totalDays,
        daysLeft: calculatedDaysLeft,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        pauseInfo: subscription.pauseInfo,
      },
    });
  } catch (err) {
    console.error('Admin resume subscription error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to resume subscription' });
  }
};
