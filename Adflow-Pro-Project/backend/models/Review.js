const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gig_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Review', reviewSchema);