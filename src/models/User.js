import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true },
  role:          { type: String, enum: ['super-admin', 'branch-admin', 'teacher-admin', 'teacher', 'student'], required: true },
  name:          { type: String, trim: true },
  email:         { type: String, lowercase: true, trim: true },
  phone:         { type: String, trim: true },
  branch:        { type: String, trim: true },
  branchId:      { type: String },
  
  // For students
  rollNo:        { type: String },
  studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  
  // For teachers
  employeeId:    { type: String },
  teacherId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  
  // ✅ Class teacher fields
  class:         { type: String },
  section:       { type: String },
  assignedClass: { type: String },
  
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.index({ username: 1 });
UserSchema.index({ role: 1, branch: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);