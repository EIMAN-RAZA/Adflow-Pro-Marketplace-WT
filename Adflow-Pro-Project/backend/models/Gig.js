const mongoose = require('mongoose');

const gigPackageSchema = new mongoose.Schema({
  name: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
  price: { type: Number, required: true, min: 0 },
  delivery_days: { type: Number, required: true, min: 1 },
  revisions: { type: Number, default: 1 },
  features: [{ type: String }]
});

const gigSchema = new mongoose.Schema({
  provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, required: true },
  packages: [gigPackageSchema],
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'active', 'rejected', 'archived'],
    default: 'draft'
  },
  rejection_reason: { type: String, default: '' },
  moderator_note: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  rating_avg: { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
  thumbnail_url: { type: String, default: '' },
  media_urls: [{ type: String }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

gigSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Gig', gigSchema);