// src/models/Student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  rollNo:          { type: String, required: true },   // ← remove unique:true here
  class:           { type: String, required: true },
  section:         { type: String, required: true },
  gender:          String,
  parentName:      String,
  phone:           String,
  email:           String,
  bloodGroup:      String,
  caste:           String,
  aadhaar:         String,
  address:         String,
  totalFee:        { type: Number, default: 0 },
  paidFee:         { type: Number, default: 0 },
  academicYear:    String,
  yearOfJoining:   String,
  dateOfJoining:   String,
  branch:          String,
  branchId:        String,
  username:        String,
  userId:          mongoose.Schema.Types.ObjectId,
  status:          { type: String, default: 'Active' },
  presentDays:     { type: Number, default: 0 },
  absentDays:      { type: Number, default: 0 },
  totalWorkingDays:{ type: Number, default: 0 },
  profileImage:    String,
  profileImagePublicId: String,
}, { timestamps: true });

// ── Compound unique index: same rollNo allowed in different branches ──
studentSchema.index({ rollNo: 1, branch: 1 }, { unique: true });

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
