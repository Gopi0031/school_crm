import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  employeeId:    { type: String, unique: true, sparse: true },
  phone:         { type: String, trim: true },
  email:         { type: String, trim: true, lowercase: true },
  qualification: { type: String, trim: true },
  experience:    { type: String, trim: true },
  subject:       { type: String, trim: true },
  class:         { type: String, trim: true },
  section:       { type: String, trim: true },
  joinYear:      { type: String },
  salary:        { type: Number, default: 0 },
  aadhaar:       { type: String, trim: true },
  pan:           { type: String, trim: true, uppercase: true },
  branch:        { type: String, trim: true },
  branchId:      { type: String },
  username:      { type: String, lowercase: true, trim: true },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  status: { 
    type: String, 
    enum: {
      values: ['Active', 'Inactive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Active',
    set: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : 'Active'  // ✅ Auto-normalize
  },
  
  // Class Teacher fields
  classTeacher:  { type: Boolean, default: false },
  assignedClass: { type: String, default: '', trim: true },
  
  // Attendance tracking
  presentDays:   { type: Number, default: 0 },
  absentDays:    { type: Number, default: 0 },
  totalDays:     { type: Number, default: 0 },
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
TeacherSchema.index({ branch: 1, employeeId: 1 });
TeacherSchema.index({ username: 1 });

export default mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);