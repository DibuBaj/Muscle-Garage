const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    userData: {
        username: String,
        fullname: String,
        phone: String,
        password: String,
        dateOfBirth: Date,
        age: Number,
        weight: Number
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300
    }
});

module.exports = mongoose.model('OTP', otpSchema);
