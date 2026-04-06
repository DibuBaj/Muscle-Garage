const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const userRoutes = require('./routes/user');
const trainerRoutes = require('./routes/trainer');
const sessionRoutes = require('./routes/session');
const bookingRoutes = require('./routes/booking');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const analyticsRoutes = require('./routes/analytics');
const { decreaseDaysDaily } = require('./controllers/subscriptionController');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const cloudinary = require('./config/cloudinary');

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint to verify Cloudinary config
app.get('/test-cloudinary', (req, res) => {
  res.json({
    cloudinary_config: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
    },
    message: 'Cloudinary credentials are configured'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Muscle Garage API is running' });
});

// Initialize default subscription plans
const initializeDefaultPlans = async () => {
  try {
    const requiredPlans = [
      {
        name: '1 Month',
        days: 30,
        price: 1500,
        isActive: true,
      },
      {
        name: '3 Months',
        days: 90,
        price: 4000,
        isActive: true,
      },
      {
        name: '12 Months',
        days: 365,
        price: 17000,
        isActive: true,
      },
    ];

    for (const plan of requiredPlans) {
      const existingPlan = await SubscriptionPlan.findOne({ name: plan.name });
      if (!existingPlan) {
        await SubscriptionPlan.create(plan);
        console.log(`✓ Created subscription plan: ${plan.name}`);
      }
    }
  } catch (err) {
    console.error('Error initializing default subscription plans:', err);
  }
};

// Cron job: Decrease daysLeft daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log('[Cron Job] Running daily subscription update...');
  decreaseDaysDaily();
});

// Initialize default plans on startup
initializeDefaultPlans();

// Export app for Vercel serverless
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, async () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}
