const Booking = require('../models/Booking');
const Trainer = require('../models/Trainer');
const WorkoutSession = require('../models/WorkoutSession');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { trainerId, sessionId, type } = req.body;
    const userId = req.user; // from authMiddleware

    if (!type || !['trainer', 'session'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid booking type' });
    }

    // Check if already booked
    const existingBooking = await Booking.findOne({
      userId,
      ...(type === 'trainer' ? { trainerId } : { sessionId }),
      type,
      isActive: true,
    });

    if (existingBooking) {
      return res.status(400).json({ success: false, message: 'Already booked' });
    }

    let bookingData = {
      userId,
      type,
      bookedAt: new Date(),
      expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    };

    if (type === 'trainer' && trainerId) {
      const trainer = await Trainer.findById(trainerId);
      if (!trainer) {
        return res.status(404).json({ success: false, message: 'Trainer not found' });
      }
      bookingData = {
        ...bookingData,
        trainerId,
        trainerName: trainer.name,
        trainerType: trainer.type,
        trainerRate: trainer.rate,
        trainerPhone: trainer.phone,
      };
    } else if (type === 'session' && sessionId) {
      const session = await WorkoutSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }
      bookingData = {
        ...bookingData,
        sessionId,
        sessionType: session.type,
        sessionTime: session.time,
        sessionDuration: session.duration,
        sessionRate: session.rate,
        sessionPhone: session.phone || '',
      };
    } else {
      return res.status(400).json({ success: false, message: 'Trainer ID or Session ID is required' });
    }

    const booking = new Booking(bookingData);
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking,
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get user's active bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user; // from authMiddleware
    const now = new Date();

    // Find active bookings that haven't expired
    const bookings = await Booking.find({
      userId,
      isActive: true,
      expiresAt: { $gt: now },
    }).sort({ bookedAt: -1 });

    // Mark as inactive if expired
    const expiredBookings = await Booking.find({
      userId,
      isActive: true,
      expiresAt: { $lte: now },
    });

    if (expiredBookings.length > 0) {
      await Booking.updateMany(
        { _id: { $in: expiredBookings.map(b => b._id) } },
        { isActive: false }
      );
    }

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (err) {
    console.error('Get user bookings error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Check if trainer/session is booked by user
exports.isBooked = async (req, res) => {
  try {
    const { trainerId, sessionId, type } = req.query;
    const userId = req.user;
    const now = new Date();

    let query = {
      userId,
      type,
      isActive: true,
      expiresAt: { $gt: now },
    };

    if (type === 'trainer' && trainerId) {
      query.trainerId = trainerId;
    } else if (type === 'session' && sessionId) {
      query.sessionId = sessionId;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid query parameters' });
    }

    const booking = await Booking.findOne(query);

    res.status(200).json({
      success: true,
      isBooked: !!booking,
      booking: booking || null,
    });
  } catch (err) {
    console.error('Check booking error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user;

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
