const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  memberId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  fullname: { type: String, required: true },
  password: { type: String, required: false },
  age: { type: Number, required: false },
  weight: { type: Number, required: false },
  authProvider: { type: String, enum: ['email', 'google'], default: 'email' },
  googleId: { type: String, required: false, unique: true, sparse: true },
  profilePicture: { type: String, required: false },
  isMobileUser: { type: Boolean, default: false }, // false: created by admin, true: created via mobile app signup
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
