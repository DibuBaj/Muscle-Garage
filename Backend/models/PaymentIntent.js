const mongoose = require('mongoose');

const paymentIntentSchema = new mongoose.Schema(
  {
    intentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    flow: {
      type: String,
      enum: ['membership', 'booking', 'store'],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
    },
    amount: {
      // Amount in paisa as required by Khalti ePayment API
      type: Number,
      required: true,
      min: 1,
    },
    pidx: {
      type: String,
      required: true,
      index: true,
    },
    purchaseOrderId: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'consumed', 'failed'],
      default: 'pending',
      index: true,
    },
    khaltiResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
