const WorkoutSession = require('../models/WorkoutSession');
const Booking = require('../models/Booking');

// Get all workout sessions
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await WorkoutSession.find().sort({ createdAt: -1 });
    
    // Get booking count for each session
    const sessionsWithBookings = await Promise.all(
      sessions.map(async (session) => {
        const bookingCount = await Booking.countDocuments({
          sessionId: session._id,
          type: 'session',
          expiresAt: { $gt: new Date() } // Only count active/non-expired bookings
        });
        
        return {
          ...session.toObject(),
          bookingCount,
          isFull: bookingCount >= session.maxCapacity
        };
      })
    );
    
    res.json({
      success: true,
      sessions: sessionsWithBookings
    });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
};

// Get session by ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await WorkoutSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    res.json({
      success: true,
      session
    });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session'
    });
  }
};

// Create workout session
exports.createSession = async (req, res) => {
  try {
    const { type, description, time, duration, rate, maxCapacity, dayOfWeek, phone } = req.body;

    // Validate required fields
    if (!type || !time || !duration || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Type, time, duration, and rate are required'
      });
    }

    const session = new WorkoutSession({
      type,
      description: (description || '').trim(),
      time,
      duration,
      rate: parseInt(rate, 10),
      maxCapacity: maxCapacity || 1,
      dayOfWeek: dayOfWeek || undefined,
      phone: phone || '',
      isActive: true
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Workout session created successfully',
      session
    });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create session'
    });
  }
};

// Update workout session
exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, time, duration, rate, maxCapacity, dayOfWeek, phone, isActive } = req.body;

    // Validate required fields
    if (!type || !time || !duration || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Type, time, duration, and rate are required'
      });
    }

    let session = await WorkoutSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.type = type;
    session.description = (description || '').trim();
    session.time = time;
    session.duration = duration;
    session.rate = parseInt(rate, 10);
    session.maxCapacity = maxCapacity || session.maxCapacity;
    session.dayOfWeek = dayOfWeek || session.dayOfWeek;
    session.phone = phone || '';
    // Update status if provided
    if (isActive !== undefined && isActive !== null) {
      session.isActive = isActive === true || isActive === 'true';
    }

    await session.save();

    res.json({
      success: true,
      message: 'Workout session updated successfully',
      session
    });
  } catch (err) {
    console.error('Update session error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update session'
    });
  }
};

// Delete workout session
exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await WorkoutSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Delete all bookings associated with this session
    await Booking.deleteMany({ sessionId: id });

    await WorkoutSession.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Workout session deleted successfully'
    });
  } catch (err) {
    console.error('Delete session error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session'
    });
  }
};

// Toggle session active status
exports.toggleSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await WorkoutSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.isActive = !session.isActive;
    await session.save();

    res.json({
      success: true,
      message: `Session ${session.isActive ? 'activated' : 'deactivated'} successfully`,
      session
    });
  } catch (err) {
    console.error('Toggle session status error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update session status'
    });
  }
};
