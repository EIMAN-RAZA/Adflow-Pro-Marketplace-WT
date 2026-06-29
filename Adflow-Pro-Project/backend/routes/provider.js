const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { auth, role } = require('../middleware/auth');

const protect = [auth, role('provider')];

// Get provider dashboard
router.get('/dashboard', auth, role('provider'), async (req, res) => {
  try {
    const gigs = await Gig.find({ provider_id: req.user._id })
      .populate('category_id', 'name');
    const orders = await Order.find({ provider_id: req.user._id })
      .populate('client_id', 'name')
      .populate('gig_id', 'title')
      .sort({ order_date: -1 });

    const stats = {
      total_gigs: gigs.length,
      active_gigs: gigs.filter(g => g.status === 'active').length,
      total_orders: orders.length,
      completed_orders: orders.filter(o => o.status === 'completed').length,
      in_progress: orders.filter(o => o.status === 'in_progress').length,
      earnings: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount, 0)
    };

    res.json({ gigs, orders, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create gig
router.post('/gigs', ...protect, async (req, res) => {
  try {
    const { title, category_id, description, packages, tags, thumbnail_url, media_urls } = req.body;
    const gig = await Gig.create({
      provider_id: req.user._id, title, category_id, description,
      packages, tags, thumbnail_url, media_urls
    });
    res.status(201).json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit gig
router.patch('/gigs/:id', ...protect, async (req, res) => {
  try {
    const gig = await Gig.findOne({ _id: req.params.id, provider_id: req.user._id });
    if (!gig) return res.status(404).json({ message: 'Not found' });
    if (!['draft', 'rejected'].includes(gig.status)) {
      return res.status(400).json({ message: 'Only draft or rejected gigs can be edited' });
    }
    Object.assign(gig, req.body);
    await gig.save();
    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit gig for review
router.patch('/gigs/:id/submit', ...protect, async (req, res) => {
  try {
    const gig = await Gig.findOne({ _id: req.params.id, provider_id: req.user._id });
    if (!gig) return res.status(404).json({ message: 'Not found' });
    if (!['draft', 'rejected'].includes(gig.status)) {
      return res.status(400).json({ message: 'Gig cannot be submitted in current state' });
    }
    if (!gig.title || !gig.description || !gig.packages?.length) {
      return res.status(400).json({ message: 'Complete gig details before submitting' });
    }
    gig.status = 'submitted';
    await gig.save();
    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start an order (after payment verified)
router.patch('/orders/:id/start', ...protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, provider_id: req.user._id });
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.status !== 'payment_verified') {
      return res.status(400).json({ message: 'Payment must be verified first' });
    }
    order.status = 'in_progress';
    order.deadline = new Date(Date.now() + order.delivery_days * 86400000);
    await order.save();

    await Notification.create({
      user_id: order.client_id,
      title: 'Work Started',
      message: 'Your provider has started working on your order.',
      type: 'info',
      link: `/client/orders/${order._id}`
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Deliver order
router.patch('/orders/:id/deliver', ...protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, provider_id: req.user._id });
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.status !== 'in_progress'&& order.status !=='revision_requested' ) {
      return res.status(400).json({ message: 'Order must be in progress to deliver' });
    }
    order.status = 'delivered';
    order.delivered_at = new Date();
    await order.save();

    await Notification.create({
      user_id: order.client_id,
      title: 'Order Delivered',
      message: 'Your provider has delivered the order. Please review and accept or request revision.',
      type: 'success',
      link: `/client/orders/${order._id}`
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;