import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName:  { type: String },
  rollNo:       { type: String },
  class:        { type: String },
  section:      { type: String },
  branch:       { type: String },
  exam:         { type: String, default: 'Annual' },
  subject:      { type: String },
  marksObtained:{ type: Number },
  totalMarks:   { type: Number },
  percentage:   { type: Number },
  status:       { type: String, enum: ['Pass','Fail'] },
  academicYear: { type: String, default: '2024-25' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);
