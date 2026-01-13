const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
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
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const { fullname, email, phone, username, age, weight } = req.body;

  try {
    // Validate required fields
    if (!fullname || !email || !phone || !username) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if email already exists (for another user)
    const existingEmail = await User.findOne({ 
      email, 
      _id: { $ne: req.user } 
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Check if username already exists (for another user)
    const existingUsername = await User.findOne({ 
      username, 
      _id: { $ne: req.user } 
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already in use'
      });
    }

    const updateData = {
      fullname,
      email,
      phone,
      username,
      age: age || null,
      weight: weight || null,
    };

    const user = await User.findByIdAndUpdate(
      req.user,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
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
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a password (for Google auth users)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google authentication. Password cannot be changed.'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};
