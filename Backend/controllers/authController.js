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
