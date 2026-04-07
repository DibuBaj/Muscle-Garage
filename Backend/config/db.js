const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.error(err.message);
    // Do not terminate the process in serverless environments.
    // Throw so callers can return structured API errors instead of crashing.
    throw err;
  }
};

module.exports = connectDB;
