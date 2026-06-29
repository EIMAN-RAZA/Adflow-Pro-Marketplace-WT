const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const Review = require('../models/Review');

// Public: browse approved or active gigs
router.get('/', async (req, res) => {
  try {
    const { category, search, min_price, max_price, sort, page = 1, limit = 12 } = req.query;
    const filter = { status: { $in: ['approved', 'active'] } };

    if (category) filter.category_id = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];

    const gigs = await Gig.find(filter)
      .populate('provider_id', 'name avatar_url')
      .populate('category_id', 'name slug')
      .sort(sort === 'rating' ? { rating_avg: -1 } : sort === 'price_asc' ? { 'packages.0.price': 1 } : { created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Gig.countDocuments(filter);
    res.json({ gigs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: featured gigs
router.get('/featured', async (req, res) => {
  try {
    const gigs = await Gig.find({ status: 'active', featured: true })
      .populate('provider_id', 'name avatar_url')
      .populate('category_id', 'name slug')
      .limit(8);
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: gig detail by slug
router.get('/:slug', async (req, res) => {
  try {
    const gig = await Gig.findOne({ slug: req.params.slug, status: { $in: ['approved', 'active'] } })
      .populate('provider_id', 'name avatar_url')
      .populate('category_id', 'name slug');
    if (!gig) return res.status(404).json({ message: 'Gig not found' });

    const reviews = await Review.find({ gig_id: gig._id })
      .populate('client_id', 'name avatar_url')
      .sort({ created_at: -1 })
      .limit(10);

    res.json({ gig, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;