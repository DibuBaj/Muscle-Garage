const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../config/email');
const { parseAndCalculateAge } = require('../utils/age');
const {
  appendQueryParams,
  decodeState,
  encodeState,
  generateMemberId,
  generateOTP,
  getGoogleMobileRedirectUri,
  resolveGoogleAuth,
} = require('../utils/authHelpers');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizePhone = (value = '') => String(value).replace(/\D/g, '');

exports.checkSignupAvailability = async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const email = String(req.body?.email || '').trim();
  const phone = normalizePhone(req.body?.phone || '');

  if (!username || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'username, email, and phone are required',
    });
  }

  try {
    const usernameRegex = new RegExp(`^${escapeRegex(username)}$`, 'i');
    const emailRegex = new RegExp(`^${escapeRegex(email)}$`, 'i');

    const [
      userByUsername,
      userByEmail,
      userByPhone,
      otpByUsername,
      otpByEmail,
      otpByPhone,
    ] = await Promise.all([
      User.findOne({ username: usernameRegex }).select('_id').lean(),
      User.findOne({ email: emailRegex }).select('_id').lean(),
      User.findOne({ phone }).select('_id').lean(),
      OTP.findOne({ 'userData.username': usernameRegex }).select('_id').lean(),
      OTP.findOne({ email: emailRegex }).select('_id').lean(),
      OTP.findOne({ 'userData.phone': phone }).select('_id').lean(),
    ]);

    const available = {
      username: !userByUsername && !otpByUsername,
      email: !userByEmail && !otpByEmail,
      phone: !userByPhone && !otpByPhone,
    };

    const errors = {};
    if (!available.username) errors.username = 'Username already exists';
    if (!available.email) errors.email = 'Email already exists';
    if (!available.phone) errors.phone = 'Phone number already exists';

    return res.status(200).json({
      success: available.username && available.email && available.phone,
      available,
      errors,
    });
  } catch (err) {
    console.error('Check signup availability error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate signup availability',
    });
  }
};

exports.sendOTP = async (req, res) => {
  const { username, email, fullname, phone, password, dateOfBirth, age, weight } = req.body;

  try {
    // Validate required fields
    if (!username || !email || !fullname || !phone || !password) {
      console.log('Missing required fields:', { username, email, fullname, phone, password: password ? 'provided' : 'missing' });
      return res.status(400).json({ message: 'Missing required fields: username, email, fullname, phone, and password' });
    }

    const userByEmail = await User.findOne({ email });

    if (userByEmail) {
      if (userByEmail.isMobileUser === false) {
        // Admin-created user: allow OTP flow, but ensure username is unique for other users
        console.log('Admin-created user found with email:', email, 'isMobileUser:', userByEmail.isMobileUser);
        const existingUsername = await User.findOne({ username, _id: { $ne: userByEmail._id } });
        if (existingUsername) {
          console.log('Username already exists for another user:', username);
          return res.status(400).json({ message: 'Username already exists' });
        }
      } else {
        console.log('Email already exists and user is mobile user:', email);
        return res.status(400).json({ message: 'Email already exists' });
      }
    } else {
      // New email: ensure username unique
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        console.log('Username already exists:', username);
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    const dobData = parseAndCalculateAge(dateOfBirth);
    if (dobData.error) {
      return res.status(400).json({ message: dobData.error });
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
        dateOfBirth: dobData.dateOfBirth,
        weight: weight || null
      }
    });

    await otpDoc.save();
    console.log('OTP saved to database for email:', email, 'OTP:', otp);
    
    try {
      await sendOTPEmail(email, otp);
      console.log('Email sent successfully to:', email);
      res.status(200).json({ 
        success: true,
        message: 'OTP sent successfully', 
        email 
      });
    } catch (emailError) {
      console.error('Failed to send email, but OTP saved:', emailError.message);
      res.status(200).json({ 
        success: true,
        message: 'OTP generated (email delivery pending)', 
        email,
        note: 'Check backend console for OTP'
      });
    }
  } catch (err) {
    console.error('SendOTP Error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP',
      error: err.message 
    });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    console.log('Verifying OTP for email:', email);
    
    const otpDoc = await OTP.findOne({ email, otp });
    if (!otpDoc) {
      console.log('Invalid or expired OTP for email:', email);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    console.log('OTP found, processing user...');
    let user = await User.findOne({ email });

    if (user && user.isMobileUser === false) {
      // Activate admin-created user
      console.log('Updating admin-created user with isMobileUser=false, email:', email);
      user.username = otpDoc.userData.username;
      user.fullname = otpDoc.userData.fullname;
      user.password = otpDoc.userData.password;
      user.dateOfBirth = otpDoc.userData.dateOfBirth || user.dateOfBirth;
      user.phone = otpDoc.userData.phone || user.phone;
      user.weight = otpDoc.userData.weight || null;
      user.isMobileUser = true;
      await user.save();
      console.log('Admin-created user activated successfully, memberId:', user.memberId);
    } else if (!user) {
      console.log('Creating new user with email:', email);
      const memberId = await generateMemberId();
      const userData = {
        memberId,
        username: otpDoc.userData.username,
        email,
        fullname: otpDoc.userData.fullname,
        password: otpDoc.userData.password,
        dateOfBirth: otpDoc.userData.dateOfBirth || null
      };

      if (otpDoc.userData.phone) {
        userData.phone = otpDoc.userData.phone;
      }

      if (otpDoc.userData.weight) {
        userData.weight = otpDoc.userData.weight;
      }

      user = new User(userData);
      await user.save();
      console.log('New user created successfully, memberId:', user.memberId);
    } else if (user.isMobileUser === true) {
      console.log('User already exists and is mobile user, returning error');
      return res.status(400).json({ message: 'User already registered' });
    }

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
        dateOfBirth: user.dateOfBirth,
        weight: user.weight,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('VerifyOTP Error:', err);
    res.status(500).send('Server Error');
  }
};

exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    console.log('Resending OTP to:', email);
    
    const existingOTP = await OTP.findOne({ email });
    if (!existingOTP) {
      console.log('No pending verification found for:', email);
      return res.status(400).json({ message: 'No pending verification found. Please sign up again.' });
    }

    const otp = generateOTP();
    existingOTP.otp = otp;
    existingOTP.createdAt = new Date();
    await existingOTP.save();
    console.log('New OTP generated for:', email);

    try {
      await sendOTPEmail(email, otp);
      console.log('Resent OTP email to:', email);
      res.status(200).json({ 
        success: true,
        message: 'OTP resent successfully' 
      });
    } catch (emailError) {
      console.error('Failed to send resend email, but OTP saved:', emailError.message);
      res.status(200).json({ 
        success: true,
        message: 'OTP generated (email delivery pending)'
      });
    }
  } catch (err) {
    console.error('ResendOTP Error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to resend OTP',
      error: err.message 
    });
  }
};

exports.signup = async (req, res) => {
  const { username, email, fullname, password, dateOfBirth, age, weight } = req.body;

  try {
    const dobData = parseAndCalculateAge(dateOfBirth);
    if (dobData.error) {
      return res.status(400).json({ message: dobData.error });
    }

    let user = await User.findOne({ email });
    
    if (user) {
      // If user exists and was created by admin (isMobileUser = false), allow signup and update data
      if (user.isMobileUser === false) {
        // Admin-created user is now signing up from mobile
        // Update user data with new information provided
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update only provided fields (username and password are required for signup)
        user.username = username;
        user.password = hashedPassword;
        user.isMobileUser = true; // Mark as mobile user now
        
        // Update other fields if provided
        if (fullname) user.fullname = fullname;
        if (dobData.dateOfBirth) user.dateOfBirth = dobData.dateOfBirth;
        if (weight) user.weight = weight;
        
        // Note: Don't update email or phone as email is the identifier
        
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
            dateOfBirth: user.dateOfBirth,
            weight: user.weight,
            createdAt: user.createdAt
          },
          message: 'Welcome back! Your profile has been activated.'
        });
        return;
      }
      
      // Regular user (created via mobile) already exists
      const field = user.email === email ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} already exists` });
    }

    // Check if username exists (for new signup)
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const memberId = await generateMemberId();

    const userData = {
      memberId,
      username,
      email,
      fullname,
      password: hashedPassword,
      dateOfBirth: dobData.dateOfBirth,
      isMobileUser: true,
    };
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
        dateOfBirth: user.dateOfBirth,
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
        dateOfBirth: user.dateOfBirth,
        weight: user.weight,
        createdAt: user.createdAt
      } 
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
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
    const result = await resolveGoogleAuth({ googleId, email, fullname, profilePicture });
    res.status(200).json(result);
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Google authentication failed',
    });
  }
};

exports.initiateGoogleMobileAuth = async (req, res) => {
  try {
    const { deeplink } = req.query;
    const appDeepLink =
      typeof deeplink === 'string' && deeplink.length > 0
        ? deeplink
        : 'musclegarage://google-auth-callback';

    const clientId = process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID_WEB;
    if (!clientId) {
      return res.status(500).json({ success: false, message: 'Google Web Client ID is not configured' });
    }

    const redirectUri = getGoogleMobileRedirectUri(req);
    const state = encodeState({ deeplink: appDeepLink, ts: Date.now() });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return res.redirect(302, authUrl.toString());
  } catch (err) {
    console.error('Initiate Google mobile auth error:', err);
    return res.status(500).json({ success: false, message: 'Failed to initiate Google authentication' });
  }
};

exports.completeGoogleMobileAuth = async (req, res) => {
  const { code, state } = req.query;

  const fallbackDeepLink = 'musclegarage://google-auth-callback';
  let appDeepLink = fallbackDeepLink;

  try {
    if (typeof state === 'string' && state.length > 0) {
      const decoded = decodeState(state);
      if (decoded?.deeplink) {
        appDeepLink = decoded.deeplink;
      }
    }

    if (!code || typeof code !== 'string') {
      const target = appendQueryParams(appDeepLink, {
        status: 'error',
        message: 'Missing Google authorization code',
      });
      return res.redirect(302, target);
    }

    const clientId = process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID_WEB;
    const clientSecret = process.env.GOOGLE_WEB_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      const target = appendQueryParams(appDeepLink, {
        status: 'error',
        message: 'Google credentials are not configured on server',
      });
      return res.redirect(302, target);
    }

    const redirectUri = getGoogleMobileRedirectUri(req);
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.id_token) {
      const target = appendQueryParams(appDeepLink, {
        status: 'error',
        message: tokenData.error_description || tokenData.error || 'Failed to exchange Google authorization code',
      });
      return res.redirect(302, target);
    }

    const userInfoResponse = await fetch('https://oauth2.googleapis.com/tokeninfo?' + new URLSearchParams({
      id_token: tokenData.id_token,
    }));
    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok || !userInfo.sub || !userInfo.email) {
      const target = appendQueryParams(appDeepLink, {
        status: 'error',
        message: userInfo.error_description || userInfo.error || 'Failed to validate Google user profile',
      });
      return res.redirect(302, target);
    }

    const target = appendQueryParams(appDeepLink, {
      status: 'success',
      googleId: userInfo.sub,
      email: userInfo.email,
      fullname: userInfo.name || '',
      profilePicture: userInfo.picture || '',
    });

    return res.redirect(302, target);
  } catch (err) {
    console.error('Complete Google mobile auth error:', err);
    const target = appendQueryParams(appDeepLink, {
      status: 'error',
      message: err.message || 'Google authentication failed',
    });
    return res.redirect(302, target);
  }
};

exports.completeGoogleOnboarding = async (req, res) => {
  const { googleId, email, fullname, profilePicture, username, phone, dateOfBirth, age, weight } = req.body;

  try {
    console.log('Completing Google onboarding for:', email);

    const dobData = parseAndCalculateAge(dateOfBirth);
    if (dobData.error) {
      return res.status(400).json({ success: false, message: dobData.error });
    }

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
      dateOfBirth: dobData.dateOfBirth,
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
        dateOfBirth: newUser.dateOfBirth,
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

// Admin Login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const adminEmail = (process.env.EMAIL_ADMIN || '').trim();
    const adminPassword = (process.env.ADMIN_PASS || '').trim();

    const receivedEmail = (email || '').trim();
    const receivedPassword = (password || '').trim();

    // Debug logging with detailed comparison
    console.log('\n========== Admin Login Attempt ==========');
    console.log('Received - Email:', `"${receivedEmail}"`, '| Length:', receivedEmail.length);
    console.log('Received - Password:', `"${receivedPassword}"`, '| Length:', receivedPassword.length);
    console.log('Expected - Email:', `"${adminEmail}"`, '| Length:', adminEmail.length);
    console.log('Expected - Password:', `"${adminPassword}"`, '| Length:', adminPassword.length);
    
    const emailLower = receivedEmail.toLowerCase();
    const adminEmailLower = adminEmail.toLowerCase();
    console.log('Email Match (case-insensitive):', emailLower === adminEmailLower);
    console.log('Password Match (exact):', receivedPassword === adminPassword);
    console.log('=========================================\n');

    // Compare credentials
    const emailMatch = receivedEmail.toLowerCase() === adminEmailLower;
    const passwordMatch = receivedPassword === adminPassword;

    if (!emailMatch || !passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password',
        debug: {
          emailMatch,
          passwordMatch
        }
      });
    }

    // Create JWT token for admin session
    const token = jwt.sign(
      { email: adminEmail, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Admin login successful');
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      email: adminEmail
    });
  } catch (err) {
    console.error('Admin Login Error:', err);
    res.status(500).json({ success: false, message: 'Failed to login' });
  }
};

