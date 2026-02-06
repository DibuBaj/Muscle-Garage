const mongoose = require('mongoose');
const Counter = require('./Counter');

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    membershipId: {
      type: String,
      unique: true,
      sparse: true,
    },
    totalDays: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    hasSubscribedBefore: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'pause'],
      default: 'active',
    },
    pauseInfo: {
      pauseStartDate: {
        type: Date,
        default: null,
      },
      pauseEndDate: {
        type: Date,
        default: null,
      },
      lastPauseDate: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Generate membershipId before saving
subscriptionSchema.pre('save', async function () {
  if (!this.membershipId && this.totalDays > 0) {
    try {
      const seq = await Counter.getNextSequence('membershipId');
      this.membershipId = `SUB${String(seq).padStart(6, '0')}`;
    } catch (err) {
      throw err;
    }
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
