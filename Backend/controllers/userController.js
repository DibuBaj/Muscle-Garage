const User = require('../models/User');
const Subscription = require('../models/Subscription');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { parseAndCalculateAge } = require('../utils/age');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

exports.uploadMiddleware = upload.single('profilePicture');

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
        dateOfBirth: user.dateOfBirth,
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
  const { fullname, email, phone, username, dateOfBirth, weight } = req.body;

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

    const dobData = parseAndCalculateAge(dateOfBirth);
    if (dobData.error) {
      return res.status(400).json({
        success: false,
        message: dobData.error,
      });
    }

    const updateData = {
      fullname,
      email,
      phone,
      username,
      dateOfBirth: dobData.dateOfBirth,
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
        dateOfBirth: user.dateOfBirth,
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

// Admin: Get all users with subscription details
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    // Get subscription data for each user
    const usersWithSubscriptions = await Promise.all(
      users.map(async (user) => {
        const subscription = await Subscription.findOne({ user: user._id });
        
        return {
          id: user._id,
          memberId: user.memberId,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          phone: user.phone,
          authProvider: user.authProvider,
          createdAt: user.createdAt,
          subscription: subscription ? {
            membershipId: subscription.membershipId,
            totalDays: subscription.totalDays,
            daysLeft: subscription.daysLeft,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            status: subscription.status,
            hasSubscribedBefore: subscription.hasSubscribedBefore,
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithSubscriptions.length,
      users: usersWithSubscriptions
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Admin: Delete a user
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's subscription if exists
    await Subscription.findOneAndDelete({ user: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Upload/Update profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture from Cloudinary if it exists
    if (user.profilePicture) {
      try {
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`muscle-garage/profiles/${publicId}`);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }

    // Upload new image to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'muscle-garage/profiles',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    // Update user's profile picture URL
    user.profilePicture = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: result.secure_url
    });
  } catch (err) {
    console.error('Upload profile picture error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  }
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to delete'
      });
    }

    // Delete from Cloudinary
    try {
      const publicId = user.profilePicture.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`muscle-garage/profiles/${publicId}`);
    } catch (err) {
      console.error('Error deleting from Cloudinary:', err);
    }

    // Remove profile picture URL from user
    user.profilePicture = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully'
    });
  } catch (err) {
    console.error('Delete profile picture error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile picture'
    });
  }
};

// Admin: Create user without password
exports.createUser = async (req, res) => {
  const { fullname, email, phone } = req.body;

  try {
    // Validate required fields
    if (!fullname || !email) {
      return res.status(400).json({
        success: false,
        message: 'Full name and email are required'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Generate memberId
    const Counter = require('../models/Counter');
    const seq = await Counter.getNextSequence('memberId');
    const memberId = `MG${String(seq).padStart(5, '0')}`;

    // Generate username from email (email prefix)
    const usernameBase = email.split('@')[0];
    let username = usernameBase;
    let usernameExists = await User.findOne({ username });
    
    // If username exists, append numbers until unique
    let counter = 1;
    while (usernameExists) {
      username = `${usernameBase}${counter}`;
      usernameExists = await User.findOne({ username });
      counter++;
    }

    // Create user without password (isMobileUser = false)
    const userData = {
      memberId,
      username,
      email,
      fullname,
      isMobileUser: false,
      phone: phone || null
    };

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        memberId: user.memberId,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        isMobileUser: user.isMobileUser
      }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

