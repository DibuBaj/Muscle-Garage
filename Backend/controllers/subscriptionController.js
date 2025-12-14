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

    res.status(200).json({
      success: true,
      subscription: {
        _id: subscription._id,
        membershipId: subscription.membershipId || null,
        totalDays: subscription.totalDays,
        daysLeft: subscription.daysLeft,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        hasSubscribedBefore: subscription.hasSubscribedBefore,
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
    subscription.daysLeft = planDetails.days;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.hasSubscribedBefore = true;

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription successful',
      subscription: {
        _id: subscription._id,
        membershipId: subscription.membershipId,
        totalDays: subscription.totalDays,
        daysLeft: subscription.daysLeft,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        hasSubscribedBefore: subscription.hasSubscribedBefore,
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
    const subscriptions = await Subscription.find({
      daysLeft: { $gt: 0 },
    });

    for (const subscription of subscriptions) {
      subscription.daysLeft = Math.max(0, subscription.daysLeft - 1);
      await subscription.save();
    }

    console.log(`[${new Date().toISOString()}] Updated ${subscriptions.length} subscriptions`);
  } catch (err) {
    console.error('Cron job error:', err);
  }
};
