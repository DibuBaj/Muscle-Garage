const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
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
  experience: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
    description: 'Years of experience'
  },
  certification: {
    url: { type: String, required: false },
    publicId: { type: String, required: false }
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  socialMedia: {
    instagram: { type: String, required: false, trim: true },
    facebook: { type: String, required: false, trim: true },
    x: { type: String, required: false, trim: true }
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    description: 'Rate per session (in Rs.)'
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

module.exports = mongoose.model('Trainer', trainerSchema);
