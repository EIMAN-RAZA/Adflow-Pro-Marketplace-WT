require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const password = 'password123';
    const password_hash = await bcrypt.hash(password, 10);

    const adminEmail = 'admin@adflow.com';
    const moderatorEmail = 'mod@adflow.com';

    // Check if they already exist
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password_hash,
        role: 'admin'
      });
      console.log('Admin account created:   / password123');
    } else {
      console.log('Admin account already exists.');
    }

    const modExists = await User.findOne({ email: moderatorEmail });
    if (!modExists) {
      await User.create({
        name: 'System Moderator',
        email: moderatorEmail,
        password_hash,
        role: 'moderator'
      });
      console.log('Moderator account created: mod@adflow.com / password123');
    } else {
      console.log('Moderator account already exists.');
    }

    const Category = require('./models/Category');
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { name: 'Graphic Design', slug: 'graphic-design', icon: 'pen-tool' },
        { name: 'Digital Marketing', slug: 'digital-marketing', icon: 'trending-up' },
        { name: 'Writing & Translation', slug: 'writing-translation', icon: 'file-text' },
        { name: 'Video & Animation', slug: 'video-animation', icon: 'video' },
        { name: 'Programming & Tech', slug: 'programming-tech', icon: 'code' },
        { name: 'Business', slug: 'business', icon: 'briefcase' }
      ];
      await Category.insertMany(defaultCategories);
      console.log('Default categories created.');
    } else {
      console.log('Categories already exist.');
    }

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seed();
