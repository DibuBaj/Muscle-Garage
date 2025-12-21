const express = require('express');
const router = express.Router();
const { signup, login, sendOTP, verifyOTP, resendOTP, forgotPassword, verifyResetOTP, resetPassword, googleAuth, completeGoogleOnboarding } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);
router.post('/google-auth', googleAuth);
router.post('/complete-google-onboarding', completeGoogleOnboarding);

router.get('/profile', authMiddleware, (req, res) => {
  res.json({ userId: req.user, message: "Access granted!" });
});

module.exports = router;
