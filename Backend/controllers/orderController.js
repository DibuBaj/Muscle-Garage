const Order = require('../models/Order');
const Product = require('../models/Product');
const PaymentIntent = require('../models/PaymentIntent');
const { sendOrderPlacedEmail, sendOrderStatusEmail } = require('../config/email');
const { initiateKhaltiPayment, lookupKhaltiPayment } = require('../utils/khalti');
const { randomUUID } = require('crypto');

const appendQueryParams = (baseUrl, params) => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  const query = new URLSearchParams(params).toString();
  return `${baseUrl}${separator}${query}`;
};

const buildOrderSummary = async (products = []) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Missing required fields');
  }

  const orderItems = [];
  let orderTotal = 0;

  for (const item of products) {
    const dbProduct = await Product.findById(item.productId);
    if (!dbProduct) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const quantity = Math.min(Number(item.quantity) || 1, dbProduct.stock);
    if (quantity <= 0) {
      throw new Error(`${dbProduct.name} is out of stock`);
    }

    orderTotal += dbProduct.price * quantity;
    orderItems.push({
      productId: String(dbProduct._id),
      productName: dbProduct.name,
      quantity,
      priceAtPurchase: dbProduct.price,
    });
  }

  return {
    orderItems,
    orderTotal,
    shippingCost: 100,
  };
};

const createOrderFromPayload = async (payload) => {
  const orderItems = [];

  for (const item of payload.orderItems) {
    const dbProduct = await Product.findById(item.productId);
    if (!dbProduct) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    if (dbProduct.stock < item.quantity) {
      throw new Error(`${dbProduct.name} does not have enough stock`);
    }

    dbProduct.stock = Math.max(0, dbProduct.stock - item.quantity);
    await dbProduct.save();

    orderItems.push({
      productId: dbProduct._id,
      productName: item.productName,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
    });
  }

  return Order.create({
    customerName: payload.customerName,
    phone: payload.phone,
    email: payload.email,
    location: payload.location,
    products: orderItems,
    status: 'Unfulfilled',
    paymentMethod: payload.paymentMethod || 'Online',
    orderTotal: payload.orderTotal,
    shippingCost: payload.shippingCost,
  });
};

const safelySendOrderPlacedEmail = async (order) => {
  try {
    await sendOrderPlacedEmail(order);
  } catch (error) {
    console.error('Order placed email failed:', error.message);
  }
};

const safelySendOrderStatusEmail = async (order) => {
  try {
    await sendOrderStatusEmail(order);
  } catch (error) {
    console.error('Order status email failed:', error.message);
  }
};

// User: create order
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      location,
      products = [],
      paymentMethod,
    } = req.body;

    if (!customerName || !phone || !email || !location || !products.length) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (paymentMethod !== 'Cash on Delivery') {
      return res.status(400).json({
        success: false,
        message: 'Only Cash on Delivery is supported via direct order endpoint',
      });
    }

    const summary = await buildOrderSummary(products);
    const order = await createOrderFromPayload({
      customerName,
      phone,
      email,
      location,
      orderItems: summary.orderItems,
      orderTotal: summary.orderTotal,
      shippingCost: summary.shippingCost,
      paymentMethod: 'Cash on Delivery',
    });

    await safelySendOrderPlacedEmail(order);

    return res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Create order error:', err);
    const isKnown = err.message?.includes('Product not found') || err.message?.includes('out of stock') || err.message?.includes('required');
    return res.status(isKnown ? 400 : 500).json({
      success: false,
      message: err.message || 'Failed to create order',
    });
  }
};

exports.initiateKhaltiOrder = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      location,
      products = [],
      returnUrl,
    } = req.body;

    if (!customerName || !phone || !email || !location || !products.length) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const summary = await buildOrderSummary(products);
    const grandTotal = summary.orderTotal + summary.shippingCost;
    const amountInPaisa = Math.round(grandTotal * 100);

    if (!Number.isFinite(amountInPaisa) || amountInPaisa <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order amount' });
    }

    const intentId = randomUUID();
    const purchaseOrderId = `store-${Date.now()}-${intentId}`;
    const finalReturnUrl = appendQueryParams(
      returnUrl || 'musclegarage://payment-callback',
      { flow: 'store', intentId }
    );

    const khaltiResponse = await initiateKhaltiPayment({
      amount: amountInPaisa,
      purchaseOrderId,
      purchaseOrderName: `Store order - ${customerName}`,
      returnUrl: finalReturnUrl,
      websiteUrl: 'https://musclegarage.app',
    });

    await PaymentIntent.create({
      intentId,
      flow: 'store',
      email,
      amount: amountInPaisa,
      pidx: khaltiResponse.pidx,
      purchaseOrderId,
      payload: {
        customerName,
        phone,
        email,
        location,
        orderItems: summary.orderItems,
        orderTotal: summary.orderTotal,
        shippingCost: summary.shippingCost,
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
    console.error('Initiate store Khalti error:', err);
    const isKnown = err.message?.includes('Product not found') || err.message?.includes('out of stock') || err.message === 'Missing required fields';
    res.status(err.statusCode || (isKnown ? 400 : 500)).json({
      success: false,
      message: err.message || 'Failed to initiate Khalti payment',
    });
  }
};

exports.completeKhaltiOrder = async (req, res) => {
  try {
    const { intentId, pidx } = req.body;

    if (!intentId || !pidx) {
      return res.status(400).json({ success: false, message: 'intentId and pidx are required' });
    }

    const intent = await PaymentIntent.findOne({ intentId, flow: 'store' });
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

    const order = await createOrderFromPayload(intent.payload);

    await safelySendOrderPlacedEmail(order);

    intent.status = 'consumed';
    intent.khaltiResponse = lookup;
    await intent.save();

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Complete store Khalti error:', err);
    const isKnown = err.message?.includes('Product not found') || err.message?.includes('stock');
    res.status(isKnown ? 400 : 500).json({
      success: false,
      message: err.message || 'Failed to complete order payment',
    });
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

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    if (previousStatus !== status && (status === 'In Progress' || status === 'Fulfilled')) {
      await safelySendOrderStatusEmail(order);
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};
