// Run: node scripts/createSuperAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const UserSchema = new mongoose.Schema({
    username: String, password: String, role: String,
    name: String, email: String, isActive: { type: Boolean, default: true },
  });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const existing = await User.findOne({ username: 'superadmin' });
  if (existing) {
    console.log('Super admin already exists!');
  } else {
    const hashed = await bcrypt.hash('Admin@1234', 10);
    await User.create({
      username: 'superadmin',
      password: hashed,
      role: 'super-admin',
      name: 'Super Admin',
      email: 'admin@school.com',
      isActive: true,
    });
    console.log('✅ Super admin created! Username: superadmin | Password: Admin@1234');
  }
  process.exit(0);
}
main();
