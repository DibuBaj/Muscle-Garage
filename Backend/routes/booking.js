const express = require('express');
const router = express.Router();
const {
  createBooking,
  initiateKhaltiBooking,
  completeKhaltiBooking,
  getUserBookings,
  isBooked,
  deleteBooking,
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new booking
router.post('/create', authMiddleware, createBooking);

// Khalti payment flow for bookings
router.post('/khalti/initiate', authMiddleware, initiateKhaltiBooking);
router.post('/khalti/complete', authMiddleware, completeKhaltiBooking);

// Get user's active bookings
router.get('/my-bookings', authMiddleware, getUserBookings);

// Check if trainer/session is booked
router.get('/is-booked', authMiddleware, isBooked);

// Delete a booking
router.delete('/:bookingId', authMiddleware, deleteBooking);

module.exports = router;
