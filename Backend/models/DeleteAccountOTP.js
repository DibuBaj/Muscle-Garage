const mongoose = require('mongoose');

const deleteAccountOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900,
  },
});

module.exports = mongoose.model('DeleteAccountOTP', deleteAccountOtpSchema);
