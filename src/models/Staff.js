import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  employeeId:    { type: String, required: true, unique: true },
  phone:         { type: String },
  email:         { type: String },
  department:    { type: String },
  designation:   { type: String },
  qualification: { type: String },
  experience:    { type: String },
  joinYear:      { type: String },
  salary:        { type: Number, default: 0 },
  branch:        { type: String },
  branchId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  presentDays:   { type: Number, default: 0 },
  aadhaar:       { type: String },
  pan:           { type: String },
  status:        { type: String, enum: ['Active','Inactive'], default: 'Active' },
  profileImage:  { type: String },
  profileImagePublicId: { type: String },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
