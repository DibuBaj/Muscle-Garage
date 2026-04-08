const express = require('express');
const router = express.Router();
const {
  createBooking,
  initiateKhaltiBooking,
  completeKhaltiBooking,
  getUserBookings,
  getAllBookingsAdmin,
  isBooked,
  deleteBooking,
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Create a new booking
router.post('/create', authMiddleware, createBooking);

// Khalti payment flow for bookings
router.post('/khalti/initiate', authMiddleware, initiateKhaltiBooking);
router.post('/khalti/complete', authMiddleware, completeKhaltiBooking);

// Get user's active bookings
router.get('/my-bookings', authMiddleware, getUserBookings);

// Admin: Get all bookings
router.get('/admin/all', adminMiddleware, getAllBookingsAdmin);

// Check if trainer/session is booked
router.get('/is-booked', authMiddleware, isBooked);

// Delete a booking
router.delete('/:bookingId', authMiddleware, deleteBooking);

module.exports = router;
