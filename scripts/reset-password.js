const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role:     String,
  name:     String,
  email:    String,
  isActive: Boolean,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const hashed = await bcrypt.hash('Admin@1234', 10);

  const result = await User.findOneAndUpdate(
    { username: 'superadmin' },
    { $set: { password: hashed, isActive: true } },
    { new: true }
  );

  if (!result) {
    console.log('❌ User not found. Run seed first.');
  } else {
    console.log('✅ Password reset successfully!');
    console.log('   Username: superadmin');
    console.log('   Password: Admin@1234');
  }

  process.exit(0);
}

reset().catch(err => { console.error(err); process.exit(1); });
