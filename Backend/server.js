const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const userRoutes = require('./routes/user');
const { decreaseDaysDaily } = require('./controllers/subscriptionController');

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Muscle Garage API is running' });
});

// Cron job: Decrease daysLeft daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log('[Cron Job] Running daily subscription update...');
  decreaseDaysDaily();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
