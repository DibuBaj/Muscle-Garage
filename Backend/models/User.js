const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  memberId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  fullname: { type: String, required: true },
  password: { type: String, required: true },
  age: { type: Number, required: false },
  weight: { type: Number, required: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
