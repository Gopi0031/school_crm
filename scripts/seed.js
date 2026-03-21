const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
  username: String, password: String, role: String,
  name: String, email: String, isActive: Boolean,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: 'superadmin' });
  if (existing) {
    console.log('superadmin already exists');
    process.exit(0);
  }

  const hashed = await bcrypt.hash('Admin@1234', 10);
  await User.create({
    username: 'superadmin',
    password: hashed,
    role:     'super-admin',
    name:     'Super Admin',
    email:    'admin@school.com',
    isActive: true,
  });
  console.log('✓ superadmin created — username: superadmin / password: Admin@1234');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
