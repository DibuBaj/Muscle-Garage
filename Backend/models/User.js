const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  weight: { type: Number, required: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
