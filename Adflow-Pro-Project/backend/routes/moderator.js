const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const Notification = require('../models/Notification');
const { auth, role } = require('../middleware/auth');

const protect = [auth, role('moderator', 'admin', 'super_admin')];

// Get gig review queue
router.get('/gig-review-queue', ...protect, async (req, res) => {
  try {
    const gigs = await Gig.find({ status: { $in: ['submitted', 'under_review'] } })
      .populate('provider_id', 'name email')
      .populate('category_id', 'name')
      .sort({ created_at: 1 });
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Review gig (approve/reject/flag)
router.patch('/gigs/:id/review', ...protect, async (req, res) => {
  try {
    const { action, note } = req.body;
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Not found' });

    if (!['submitted', 'under_review'].includes(gig.status)) {
      return res.status(400).json({ message: 'Gig not in reviewable state' });
    }

    if (action === 'approve') {
      gig.status = 'approved';
      gig.moderator_note = note || '';
    } else if (action === 'reject') {
      gig.status = 'rejected';
      gig.rejection_reason = note || 'Does not meet platform standards';
      gig.moderator_note = note || '';
    } else if (action === 'flag') {
      gig.status = 'under_review';
      gig.moderator_note = note || '';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await gig.save();

    await Notification.create({
      user_id: gig.provider_id,
      title: `Gig ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Flagged for Review'}`,
      message: `Your gig "${gig.title}" has been ${action === 'approve' ? 'approved and forwarded to admin' : action === 'reject' ? 'rejected' : 'flagged for further review'}.`,
      type: action === 'approve' ? 'success' : 'warning',
      link: `/provider/gigs/${gig._id}`
    });

    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;