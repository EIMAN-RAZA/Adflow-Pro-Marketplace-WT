require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const gigRoutes = require('./routes/gigs');
const providerRoutes = require('./routes/provider');
const clientRoutes = require('./routes/client');
const moderatorRoutes = require('./routes/moderator');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const Order = require('./models/Order');
const Notification = require('./models/Notification');

const app = express();

app.use(cors());
app.use(express.json());

// DB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// CRON: Check overdue orders every hour
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const overdueOrders = await Order.find({
      status: 'in_progress',
      deadline: { $lt: now }
    });

    for (const order of overdueOrders) {
      await Notification.create({
        user_id: order.provider_id,
        title: 'Order Overdue',
        message: `Order #${order._id.toString().slice(-6)} has passed its deadline.`,
        type: 'warning',
        link: `/provider/orders/${order._id}`
      });
      await Notification.create({
        user_id: order.client_id,
        title: 'Order Overdue',
        message: `Your order #${order._id.toString().slice(-6)} has passed its deadline. You may request revision or raise a dispute.`,
        type: 'warning',
        link: `/client/orders/${order._id}`
      });
    }
    if (overdueOrders.length > 0) {
      console.log(`[CRON] Notified ${overdueOrders.length} overdue orders`);
    }
  } catch (err) {
    console.error('[CRON] Error:', err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));