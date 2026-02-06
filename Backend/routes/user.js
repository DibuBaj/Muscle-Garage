const express = require('express');
const router = express.Router();
const { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  getAllUsers, 
  deleteUser,
  uploadProfilePicture,
  deleteProfilePicture,
  uploadMiddleware,
  createUser
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Get user profile
router.get('/profile', authMiddleware, getUserProfile);

// Update user profile
router.put('/profile', authMiddleware, updateUserProfile);

// Change password
router.post('/change-password', authMiddleware, changePassword);

// Profile picture routes
router.post('/profile-picture', authMiddleware, uploadMiddleware, uploadProfilePicture);
router.delete('/profile-picture', authMiddleware, deleteProfilePicture);

// Admin routes
router.get('/admin/all', adminMiddleware, getAllUsers);
router.post('/admin/create', adminMiddleware, createUser);
router.delete('/admin/:userId', adminMiddleware, deleteUser);

module.exports = router;
