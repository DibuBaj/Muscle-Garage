const Booking = require('../models/Booking');
const Trainer = require('../models/Trainer');
const WorkoutSession = require('../models/WorkoutSession');
const PaymentIntent = require('../models/PaymentIntent');
const { initiateKhaltiPayment, lookupKhaltiPayment } = require('../utils/khalti');
const { randomUUID } = require('crypto');

const appendQueryParams = (baseUrl, params) => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  const query = new URLSearchParams(params).toString();
  return `${baseUrl}${separator}${query}`;
};

const resolveBookingDetails = async (userId, type, trainerId, sessionId) => {
  if (!type || !['trainer', 'session'].includes(type)) {
    throw new Error('Invalid booking type');
  }

  const existingBooking = await Booking.findOne({
    userId,
    ...(type === 'trainer' ? { trainerId } : { sessionId }),
    type,
    isActive: true,
  });

  if (existingBooking) {
    throw new Error('Already booked');
  }

  if (type === 'trainer' && trainerId) {
    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    return {
      type,
      amount: Number(trainer.rate),
      payload: {
        trainerId: String(trainer._id),
        trainerName: trainer.name,
        trainerType: trainer.type,
        trainerRate: trainer.rate,
        trainerPhone: trainer.phone,
      },
      orderName: `Trainer booking - ${trainer.name}`,
    };
  }

  if (type === 'session' && sessionId) {
    const session = await WorkoutSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return {
      type,
      amount: Number(session.rate),
      payload: {
        sessionId: String(session._id),
        sessionType: session.type,
        sessionTime: session.time,
        sessionDuration: session.duration,
        sessionRate: session.rate,
        sessionPhone: session.phone || '',
      },
      orderName: `Session booking - ${session.type}`,
    };
  }

  throw new Error('Trainer ID or Session ID is required');
};

const createBookingFromPayload = async (userId, payload) => {
  const bookingData = {
    userId,
    type: payload.type,
    bookedAt: new Date(),
    expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
  };

  if (payload.type === 'trainer') {
    return Booking.create({
      ...bookingData,
      trainerId: payload.trainerId,
      trainerName: payload.trainerName,
      trainerType: payload.trainerType,
      trainerRate: payload.trainerRate,
      trainerPhone: payload.trainerPhone,
    });
  }

  return Booking.create({
    ...bookingData,
    sessionId: payload.sessionId,
    sessionType: payload.sessionType,
    sessionTime: payload.sessionTime,
    sessionDuration: payload.sessionDuration,
    sessionRate: payload.sessionRate,
    sessionPhone: payload.sessionPhone,
  });
};

// Create a new booking
exports.createBooking = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Direct booking is disabled. Use Khalti payment endpoints.',
  });
};

exports.initiateKhaltiBooking = async (req, res) => {
  try {
    const userId = req.user;
    const { trainerId, sessionId, type, returnUrl } = req.body;

    const details = await resolveBookingDetails(userId, type, trainerId, sessionId);
    const amountInPaisa = Math.round(Number(details.amount) * 100);
    if (!Number.isFinite(amountInPaisa) || amountInPaisa <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking amount' });
    }

    const intentId = randomUUID();
    const purchaseOrderId = `booking-${userId}-${intentId}`;
    const finalReturnUrl = appendQueryParams(
      returnUrl || 'musclegarage://payment-callback',
      { flow: 'booking', intentId }
    );

    const khaltiResponse = await initiateKhaltiPayment({
      amount: amountInPaisa,
      purchaseOrderId,
      purchaseOrderName: details.orderName,
      returnUrl: finalReturnUrl,
      websiteUrl: 'https://musclegarage.app',
    });

    await PaymentIntent.create({
      intentId,
      flow: 'booking',
      userId,
      amount: amountInPaisa,
      pidx: khaltiResponse.pidx,
      purchaseOrderId,
      payload: {
        type: details.type,
        ...details.payload,
      },
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      intentId,
      pidx: khaltiResponse.pidx,
      paymentUrl: khaltiResponse.payment_url,
      expiresAt: khaltiResponse.expires_at,
      expiresIn: khaltiResponse.expires_in,
    });
  } catch (err) {
    console.error('Initiate booking Khalti error:', err);
    const known400 = ['Invalid booking type', 'Already booked', 'Trainer not found', 'Session not found', 'Trainer ID or Session ID is required'];
    const status = err.statusCode || (known400.includes(err.message) ? 400 : 500);
    res.status(status).json({ success: false, message: err.message || 'Failed to initiate Khalti payment' });
  }
};

exports.completeKhaltiBooking = async (req, res) => {
  try {
    const userId = req.user;
    const { intentId, pidx } = req.body;

    if (!intentId || !pidx) {
      return res.status(400).json({ success: false, message: 'intentId and pidx are required' });
    }

    const intent = await PaymentIntent.findOne({ intentId, flow: 'booking', userId });
    if (!intent) {
      return res.status(404).json({ success: false, message: 'Payment intent not found' });
    }

    if (intent.status === 'consumed') {
      return res.status(409).json({ success: false, message: 'Payment intent already consumed' });
    }

    if (intent.pidx !== pidx) {
      return res.status(400).json({ success: false, message: 'Payment reference mismatch' });
    }

    const lookup = await lookupKhaltiPayment(pidx);
    if (lookup.status !== 'Completed') {
      intent.status = 'failed';
      intent.khaltiResponse = lookup;
      await intent.save();
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const payload = intent.payload || {};
    await resolveBookingDetails(
      userId,
      payload.type,
      payload.trainerId,
      payload.sessionId
    );

    const booking = await createBookingFromPayload(userId, payload);

    intent.status = 'consumed';
    intent.khaltiResponse = lookup;
    await intent.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking,
    });
  } catch (err) {
    console.error('Complete booking Khalti error:', err);
    const known400 = ['Invalid booking type', 'Already booked', 'Trainer not found', 'Session not found', 'Trainer ID or Session ID is required'];
    const status = known400.includes(err.message) ? 400 : 500;
    res.status(status).json({ success: false, message: err.message || 'Failed to complete booking payment' });
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
