const mongoose = require('mongoose');

const workoutSessionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'Weight Lifting',
      'CrossFit',
      'Yoga',
      'Cardio',
      'Pilates',
      'Boxing',
      'Fitness',
      'Strength & Conditioning',
      'Personal Training',
      'Group Fitness'
    ]
  },
  time: {
    type: String,
    required: true,
    description: 'Session time (e.g., "10:00 AM", "02:30 PM")'
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    description: 'Duration in minutes'
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    description: 'Rate per session (in Rs.)'
  },
  maxCapacity: {
    type: Number,
    required: false,
    default: 1,
    min: 1,
    description: 'Maximum number of participants'
  },
  dayOfWeek: {
    type: String,
    required: false,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    description: 'Day of week for recurring session'
  },
  phone: {
    type: String,
    required: false,
    description: 'Contact phone number for the session instructor'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);
