const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  opened_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['open', 'under_review', 'resolved', 'closed'], default: 'open' },
  resolution_note: { type: String, default: '' },
  resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);