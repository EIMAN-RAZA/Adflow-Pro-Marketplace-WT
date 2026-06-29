const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');
const Notification = require('../models/Notification');
const { auth, role } = require('../middleware/auth');

const protect = [auth, role('client')];

// Client dashboard
router.get('/dashboard', ...protect, async (req, res) => {
  try {
    const orders = await Order.find({ client_id: req.user._id })
      .populate('gig_id', 'title thumbnail_url')
      .populate('provider_id', 'name avatar_url')
      .sort({ order_date: -1 });

    const stats = {
      total_orders: orders.length,
      active: orders.filter(o => ['in_progress', 'delivered', 'payment_verified'].includes(o.status)).length,
      completed: orders.filter(o => o.status === 'completed').length,
      total_spent: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount, 0)
    };

    res.json({ orders, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Place order
router.post('/orders', ...protect, async (req, res) => {
  try {
    const { gig_id, package_name, requirements } = req.body;
    const gig = await Gig.findOne({ _id: gig_id, status: 'active' });
    if (!gig) return res.status(404).json({ message: 'Gig not found or not active' });

    const pkg = gig.packages.find(p => p.name === package_name);
    if (!pkg) return res.status(400).json({ message: 'Invalid package' });

    const order = await Order.create({
      client_id: req.user._id,
      provider_id: gig.provider_id,
      gig_id,
      package_name,
      amount: pkg.price,
      delivery_days: pkg.delivery_days,
      requirements,
      status: 'placed'
    });

    await Notification.create({
      user_id: gig.provider_id,
      title: 'New Order Received',
      message: `You received a new order for "${gig.title}".`,
      type: 'success',
      link: `/provider/orders/${order._id}`
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit payment
router.post('/payments', ...protect, async (req, res) => {
  try {
    const { order_id, method, transaction_ref, sender_name, screenshot_url } = req.body;
    const order = await Order.findOne({ _id: order_id, client_id: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'placed') {
      return res.status(400).json({ message: 'Payment already submitted' });
    }

    const existing = await Payment.findOne({ transaction_ref });
    if (existing) return res.status(400).json({ message: 'Duplicate transaction reference' });

    const payment = await Payment.create({
      order_id, client_id: req.user._id, amount: order.amount,
      method, transaction_ref, sender_name, screenshot_url
    });

    order.status = 'payment_pending';
    await order.save();

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Complete order
router.patch('/orders/:id/complete', ...protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, client_id: req.user._id });
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Order must be delivered first' });
    }
    order.status = 'completed';
    order.completed_at = new Date();
    await order.save();

    await Notification.create({
      user_id: order.provider_id,
      title: 'Order Completed',
      message: 'Client has accepted your delivery. Order is now complete.',
      type: 'success'
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Request revision
router.patch('/orders/:id/revision', ...protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, client_id: req.user._id });
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Order must be delivered to request revision' });
    }
    order.status = 'revision_requested';
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit review
router.post('/reviews', ...protect, async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    const order = await Order.findOne({ _id: order_id, client_id: req.user._id, status: 'completed' });
    if (!order) return res.status(404).json({ message: 'Completed order not found' });

    const existing = await Review.findOne({ order_id });
    if (existing) return res.status(400).json({ message: 'Already reviewed' });

    const review = await Review.create({
      order_id, client_id: req.user._id, provider_id: order.provider_id,
      gig_id: order.gig_id, rating, comment
    });

    // Update gig rating
    const allReviews = await Review.find({ gig_id: order.gig_id });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Gig.findByIdAndUpdate(order.gig_id, { rating_avg: avg.toFixed(1), rating_count: allReviews.length });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Open dispute
router.post('/disputes', ...protect, async (req, res) => {
  try {
    const { order_id, reason } = req.body;
    const order = await Order.findOne({ _id: order_id, client_id: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const dispute = await Dispute.create({ order_id, opened_by: req.user._id, reason });
    res.status(201).json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;