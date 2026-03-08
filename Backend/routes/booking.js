const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  isBooked,
  deleteBooking,
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new booking
router.post('/create', authMiddleware, createBooking);

// Get user's active bookings
router.get('/my-bookings', authMiddleware, getUserBookings);

// Check if trainer/session is booked
router.get('/is-booked', authMiddleware, isBooked);

// Delete a booking
router.delete('/:bookingId', authMiddleware, deleteBooking);

module.exports = router;
