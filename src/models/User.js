import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true },
  role:         { type: String, enum: ['super-admin','branch-admin','teacher-admin','student'], required: true },
  name:         { type: String, required: true },
  email:        { type: String, default: '' },
  phone:        { type: String, default: '' },
  branch:       { type: String, default: '' },
  branchId:     { type: String, default: '' },
  class:        { type: String, default: '' },
  section:      { type: String, default: '' },
  rollNo:       { type: String, default: '' },
  studentId:    { type: String, default: '' },
  profileImage: { type: String, default: '' },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
