const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// Get my notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id })
      .sort({ created_at: -1 }).limit(30);
    const unread = await Notification.countDocuments({ user_id: req.user._id, is_read: false });
    res.json({ notifications, unread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark all read
router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.user._id, is_read: false }, { is_read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;