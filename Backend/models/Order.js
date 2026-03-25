const mongoose = require('mongoose');

const OrderProductSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    products: { type: [OrderProductSchema], required: true },
    status: {
      type: String,
      enum: ['Unfulfilled', 'In Progress', 'Fulfilled'],
      default: 'Unfulfilled',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Online'],
      default: 'Cash on Delivery',
    },
    orderTotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 100, min: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
