const Order = require('../models/Order');
const Product = require('../models/Product');

// User: create order
exports.createOrder = async (req, res) => {
  try {
    const { customerName, phone, email, location, products = [], paymentMethod = 'Cash on Delivery' } = req.body;

    if (!customerName || !phone || !email || !location || !products.length) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const shippingCost = 100;
    const orderItems = [];
    let orderTotal = 0;

    for (const item of products) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }
      const quantity = Math.min(item.quantity || 1, dbProduct.stock);
      if (quantity <= 0) {
        return res.status(400).json({ success: false, message: `${dbProduct.name} is out of stock` });
      }
      orderTotal += dbProduct.price * quantity;
      orderItems.push({
        productId: dbProduct._id,
        productName: dbProduct.name,
        quantity,
        priceAtPurchase: dbProduct.price,
      });
      // reduce stock
      dbProduct.stock = Math.max(0, dbProduct.stock - quantity);
      await dbProduct.save();
    }

    const order = await Order.create({
      customerName,
      phone,
      email,
      location,
      products: orderItems,
      status: 'Unfulfilled',
      paymentMethod,
      orderTotal,
      shippingCost,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
};

// User: get orders by email
exports.getUserOrders = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const orders = await Order.find({ email }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Get user orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// Admin: list orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// Admin: update status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Unfulfilled', 'In Progress', 'Fulfilled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};
