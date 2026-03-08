const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      example: '1 Month',
    },
    days: {
      type: Number,
      required: true,
      positive: true,
      example: 30,
    },
    price: {
      type: Number,
      required: true,
      positive: true,
      example: 1500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

// Create index for name
subscriptionPlanSchema.index({ name: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
