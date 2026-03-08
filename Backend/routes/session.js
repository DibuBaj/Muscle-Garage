const express = require('express');
const router = express.Router();
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  toggleSessionStatus
} = require('../controllers/sessionController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Get all sessions
router.get('/all', getAllSessions);

// Admin routes (must come before /:id to avoid conflicts)
// Create session
router.post('/admin/create', adminMiddleware, createSession);

// Update session
router.put('/admin/:id', adminMiddleware, updateSession);

// Delete session
router.delete('/admin/:id', adminMiddleware, deleteSession);

// Toggle session status
router.patch('/admin/:id/status', adminMiddleware, toggleSessionStatus);

// Get session by ID (must come after /admin routes)
router.get('/:id', getSessionById);

module.exports = router;
