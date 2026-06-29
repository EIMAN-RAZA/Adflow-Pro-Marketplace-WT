const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { auth, role } = require('../middleware/auth');

// Public: list active categories
router.get('/', async (req, res) => {
  try {
    const cats = await Category.find({ is_active: true }).sort('name');
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin/Super Admin: create category
router.post('/', auth, role('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, icon } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat = await Category.create({ name, slug, icon });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: toggle active
router.patch('/:id/toggle', auth, role('admin', 'super_admin'), async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Not found' });
    cat.is_active = !cat.is_active;
    await cat.save();
    res.json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;