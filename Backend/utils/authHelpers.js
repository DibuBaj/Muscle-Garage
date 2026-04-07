const User = require('../models/User');
const Counter = require('../models/Counter');
const jwt = require('jsonwebtoken');

const generateMemberId = async () => {
  const seq = await Counter.getNextSequence('memberId');
  return `MG${String(seq).padStart(5, '0')}`;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const appendQueryParams = (baseUrl, params) => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  const query = new URLSearchParams(params).toString();
  return `${baseUrl}${separator}${query}`;
};

const resolveGoogleAuth = async ({ googleId, email, fullname, profilePicture }) => {
  if (!googleId || !email || !fullname) {
    throw new Error('googleId, email, and fullname are required');
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      if (profilePicture) user.profilePicture = profilePicture;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d',
    });

    return {
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
        authProvider: user.authProvider,
      },
      isNewUser: false,
    };
  }

  return {
    success: true,
    message: 'New user - proceed with onboarding',
    isNewUser: true,
    tempUser: {
      googleId,
      email,
      fullname,
      profilePicture,
    },
  };
};

const encodeState = (input) => {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
};

const decodeState = (encoded) => {
  const raw = Buffer.from(encoded, 'base64url').toString('utf8');
  return JSON.parse(raw);
};

const getGoogleMobileRedirectUri = (req) => {
  const envRedirectUri = process.env.GOOGLE_MOBILE_REDIRECT_URI;
  if (envRedirectUri) {
    return envRedirectUri;
  }
  return `${req.protocol}://${req.get('host')}/api/auth/google/mobile/callback`;
};

module.exports = {
  appendQueryParams,
  decodeState,
  encodeState,
  generateMemberId,
  generateOTP,
  getGoogleMobileRedirectUri,
  resolveGoogleAuth,
};