const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Dispute = require('../models/Dispute');
const Notification = require('../models/Notification');
const { auth, role } = require('../middleware/auth');

const protect = [auth, role('admin', 'super_admin')];

// Analytics
router.get('/analytics', ...protect, async (req, res) => {
  try {
    const [users, gigs, orders, payments] = await Promise.all([
      User.countDocuments(),
      Gig.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Payment.find({ status: 'verified' })
    ]);

    const revenue = payments.reduce((s, p) => s + p.amount, 0);
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({ users, active_gigs: gigs, orders, revenue, ordersByStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Payment verification queue
router.get('/payment-queue', ...protect, async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('order_id')
      .populate('client_id', 'name email')
      .sort({ createdAt: 1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify/reject payment
router.patch('/payments/:id/verify', ...protect, async (req, res) => {
  try {
    const { action, note } = req.body;
    const payment = await Payment.findById(req.params.id).populate('order_id');
    if (!payment) return res.status(404).json({ message: 'Not found' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Already processed' });

    const order = payment.order_id;

    if (action === 'verify') {
      payment.status = 'verified';
      order.status = 'payment_verified';

      await Notification.create({
        user_id: order.client_id,
        title: 'Payment Verified',
        message: 'Your payment has been verified. The provider will start work soon.',
        type: 'success',
        link: `/client/orders/${order._id}`
      });
      await Notification.create({
        user_id: order.provider_id,
        title: 'Payment Verified - Start Work',
        message: 'Client payment verified. You can now start the order.',
        type: 'success',
        link: `/provider/orders/${order._id}`
      });
    } else {
      payment.status = 'rejected';
      payment.admin_note = note || '';
      order.status = 'cancelled';
    }

    await payment.save();
    await order.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve gig (after moderator approves)
router.patch('/gigs/:id/activate', ...protect, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Not found' });
    if (gig.status !== 'approved') return res.status(400).json({ message: 'Gig must be moderator-approved first' });
    gig.status = 'active';
    await gig.save();

    await Notification.create({
      user_id: gig.provider_id,
      title: 'Gig Now Live',
      message: `Your gig "${gig.title}" is now live and visible to clients.`,
      type: 'success'
    });

    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approved gigs waiting admin activation
router.get('/gig-activation-queue', ...protect, async (req, res) => {
  try {
    const gigs = await Gig.find({ status: 'approved' })
      .populate('provider_id', 'name email')
      .populate('category_id', 'name')
      .sort({ updated_at: 1 });
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All users
router.get('/users', ...protect, async (req, res) => {
  try {
    const users = await User.find().select('-password_hash').sort({ created_at: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user status/role
router.patch('/users/:id', ...protect, async (req, res) => {
  try {
    const { status, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status, role }, { new: true }).select('-password_hash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Disputes
router.get('/disputes', ...protect, async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate('order_id')
      .populate('opened_by', 'name email')
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/disputes/:id/resolve', ...protect, async (req, res) => {
  try {
    const { resolution_note } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(req.params.id, {
      status: 'resolved', resolution_note, resolved_by: req.user._id
    }, { new: true });
    res.json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;