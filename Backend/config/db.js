const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not configured');
    return;
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    // Do not terminate the process in serverless environments.
    // Let request handlers return proper JSON errors instead of FUNCTION_INVOCATION_FAILED.
  }
};

module.exports = connectDB;
