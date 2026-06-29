const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gig_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  package_name: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
  amount: { type: Number, required: true },
  delivery_days: { type: Number, required: true },
  requirements: { type: String, default: '' },
  status: {
    type: String,
    enum: [
      'placed', 'payment_pending', 'payment_verified',
      'in_progress', 'delivered', 'revision_requested',
      'completed', 'cancelled', 'archived'
    ],
    default: 'placed'
  },
  deadline: { type: Date },
  delivered_at: { type: Date },
  completed_at: { type: Date }
}, { timestamps: { createdAt: 'order_date', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Order', orderSchema);