const User = require('../models/User');
const Counter = require('../models/Counter');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../config/email');

const generateMemberId = async () => {
  const seq = await Counter.getNextSequence('memberId');
  return `MG${String(seq).padStart(5, '0')}`;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.sendOTP = async (req, res) => {
  const { username, email, fullname, phone, password, age, weight } = req.body;

  try {
    // Validate required fields
    if (!username || !email || !fullname || !phone || !password) {
      console.log('Missing required fields:', { username, email, fullname, phone, password: password ? 'provided' : 'missing' });
      return res.status(400).json({ message: 'Missing required fields: username, email, fullname, phone, and password' });
    }

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      const field = user.email === email ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} already exists` });
    }

    await OTP.deleteMany({ email });

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    const otpDoc = new OTP({
      email,
      otp,
      userData: {
        username,
        fullname,
        phone,
        password: hashedPassword,
        age: age || null,
        weight: weight || null
      }
    });

    await otpDoc.save();
    
    try {
      await sendOTPEmail(email, otp);
      res.status(200).json({ message: 'OTP sent successfully', email });
    } catch (emailError) {
      console.error('Failed to send email, but OTP saved:', emailError.message);
      res.status(200).json({ 
        message: 'OTP generated (email delivery pending)', 
        email,
        note: 'Check backend console for OTP'
      });
    }
  } catch (err) {
    console.error('SendOTP Error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpDoc = await OTP.findOne({ email, otp });
    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const memberId = await generateMemberId();
    const userData = {
      memberId,
      username: otpDoc.userData.username,
      email,
      fullname: otpDoc.userData.fullname,
      password: otpDoc.userData.password,
      age: otpDoc.userData.age
    };

    if (otpDoc.userData.phone) {
      userData.phone = otpDoc.userData.phone;
    }

    if (otpDoc.userData.weight) {
      userData.weight = otpDoc.userData.weight;
    }

    const user = new User(userData);
    await user.save();

    await OTP.deleteMany({ email });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        memberId: user.memberId,
        username: user.username,
        email: user.email,
        phone: user.phone,
        fullname: user.fullname,
        age: user.age,
        weight: user.weight,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const existingOTP = await OTP.findOne({ email });
    if (!existingOTP) {
      return res.status(400).json({ message: 'No pending verification found. Please sign up again.' });
    }

    const otp = generateOTP();
    existingOTP.otp = otp;
    existingOTP.createdAt = new Date();
    await existingOTP.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
};

exports.signup = async (req, res) => {
  const { username, email, fullname, password, age, weight } = req.body;

  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      const field = user.email === email ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const memberId = await generateMemberId();

    const userData = { memberId, username, email, fullname, password: hashedPassword, age };
    if (weight) userData.weight = weight;

    user = new User(userData);
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ 
      token, 
      user: { 
        id: user._id,
        memberId: user.memberId,
        username: user.username, 
        email: user.email,
        phone: user.phone,
        fullname: user.fullname,
        age: user.age,
        weight: user.weight,
        createdAt: user.createdAt
      } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ 
      token, 
      user: { 
        id: user._id,
        memberId: user.memberId,
        username: user.username, 
        email: user.email,
        phone: user.phone,
        fullname: user.fullname,
        age: user.age,
        weight: user.weight,
        createdAt: user.createdAt
      } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    console.log('Forgot password request for email:', email);
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email not found' });
    }

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });
    console.log('Deleted existing OTPs for email:', email);

    // Generate and save new OTP
    const otp = generateOTP();
    const otpDoc = new OTP({
      email,
      otp,
      userData: {} // Empty since we're just resetting password
    });

    await otpDoc.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
      res.status(200).json({ 
        success: true, 
        message: 'OTP sent to your email',
        email 
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError.message);
      res.status(200).json({ 
        success: true, 
        message: 'OTP generated (check backend console)',
        email,
        note: 'Email delivery pending'
      });
    }
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ success: false, message: 'Failed to process forgot password request' });
  }
};

exports.verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Verify OTP
    const otpDoc = await OTP.findOne({ email, otp });
    console.log('OTP found in verifyResetOTP:', !!otpDoc);
    if (!otpDoc) {
      console.log('OTP not found, checking all OTPs for email:', email);
      const allOtps = await OTP.find({ email });
      console.log('All OTPs:', allOtps.map(o => ({ otp: o.otp, createdAt: o.createdAt })));
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'OTP verified successfully'
    });
  } catch (err) {
    console.error('Verify Reset OTP Error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    console.log('Reset password request:', { email, otp, newPasswordLength: newPassword?.length });
    
    // Verify OTP
    const otpDoc = await OTP.findOne({ email, otp });
    console.log('OTP lookup in resetPassword - Found:', !!otpDoc);
    
    if (!otpDoc) {
      console.log('OTP not found. Searching with email:', email, 'otp:', otp);
      // Debug: Check what OTPs exist for this email
      const allOtps = await OTP.find({ email });
      console.log('All OTPs for this email:', allOtps.map(o => ({ 
        otp: o.otp, 
        email: o.email,
        createdAt: o.createdAt,
        expired: new Date(o.createdAt).getTime() + 300000 < Date.now()
      })));
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();
    console.log('Password updated for user:', email);

    // Delete OTP after successful password reset
    await OTP.deleteMany({ email });
    console.log('OTP deleted for user:', email);

    res.status(200).json({ 
      success: true, 
      message: 'Password reset successfully'
    });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

exports.googleAuth = async (req, res) => {
  const { googleId, email, fullname, profilePicture } = req.body;

  try {
    console.log('Google Auth request:', { googleId, email, fullname });

    // Check if user exists
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Existing user - login
      console.log('Existing user found:', user.email);
      
      // If user email matches but no googleId, link the account
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (profilePicture) user.profilePicture = profilePicture;
        await user.save();
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d'
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          memberId: user.memberId,
          username: user.username,
          email: user.email,
          fullname: user.fullname,
          phone: user.phone,
          age: user.age,
          weight: user.weight,
          profilePicture: user.profilePicture,
          authProvider: user.authProvider
        },
        isNewUser: false
      });
    } else {
      // New user - return info so frontend can proceed with onboarding
      res.status(200).json({
        success: true,
        message: 'New user - proceed with onboarding',
        isNewUser: true,
        tempUser: {
          googleId,
          email,
          fullname,
          profilePicture
        }
      });
    }
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};

exports.completeGoogleOnboarding = async (req, res) => {
  const { googleId, email, fullname, profilePicture, username, phone, age, weight } = req.body;

  try {
    console.log('Completing Google onboarding for:', email);

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Generate member ID
    const memberId = await generateMemberId();

    // Create new user
    const newUser = new User({
      memberId,
      username,
      email,
      fullname,
      phone,
      age: age || null,
      weight: weight || null,
      googleId,
      profilePicture,
      authProvider: 'google'
    });

    await newUser.save();
    console.log('New Google user created:', email);

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d'
    });

    res.status(201).json({
      success: true,
      message: 'Onboarding completed successfully',
      token,
      user: {
        id: newUser._id,
        memberId: newUser.memberId,
        username: newUser.username,
        email: newUser.email,
        fullname: newUser.fullname,
        phone: newUser.phone,
        age: newUser.age,
        weight: newUser.weight,
        profilePicture: newUser.profilePicture,
        authProvider: newUser.authProvider
      }
    });
  } catch (err) {
    console.error('Google Onboarding Error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete onboarding' });
  }
};
