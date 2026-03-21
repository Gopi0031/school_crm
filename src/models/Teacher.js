import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  employeeId:    { type: String, default: '' },
  phone:         { type: String, default: '' },
  email:         { type: String, default: '' },
  gender:        { type: String, default: '' },
  dob:           { type: String, default: '' },
  address:       { type: String, default: '' },
  qualification: { type: String, default: '' },
  experience:    { type: String, default: '' },
  subject:       { type: String, default: '' },
  class:         { type: String, default: '' },
  section:       { type: String, default: '' },
  branch:        { type: String, default: '' },
  branchId:      { type: String, default: '' },
  salary:        { type: Number, default: 0 },
  profileImage:  { type: String, default: '' },
  profileImagePublicId: { type: String, default: '' },
  status:        { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  userId:        { type: String, default: '' },
  joinDate:      { type: String, default: '' },
  joinYear:      { type: String, default: '' },
  aadhaar:       { type: String, default: '' },
  pan:           { type: String, default: '' },

  // ✅ Class Teacher Assignment — was missing, causing silent update failure
  assignedClass: { type: String, default: '' },
  classTeacher:  { type: Boolean, default: false },

  // ✅ Attendance tracking — was missing
  presentDays:   { type: Number, default: 0 },
  absentDays:    { type: Number, default: 0 },
  totalDays:     { type: Number, default: 0 },

}, { timestamps: true });

export default mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);
