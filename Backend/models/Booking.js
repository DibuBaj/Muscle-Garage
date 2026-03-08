const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: false },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutSession', required: false },
  type: { type: String, enum: ['trainer', 'session'], required: true },
  bookedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // 1 month from bookedAt
  isActive: { type: Boolean, default: true },
  trainerName: { type: String, required: false },
  trainerType: { type: String, required: false },
  trainerRate: { type: Number, required: false },
  trainerPhone: { type: String, required: false },
  sessionType: { type: String, required: false },
  sessionTime: { type: String, required: false },
  sessionDuration: { type: Number, required: false },
  sessionRate: { type: Number, required: false },
  sessionPhone: { type: String, required: false },
}, { timestamps: true });

// TTL index to automatically delete expired bookings after 30 days
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Booking', bookingSchema);
