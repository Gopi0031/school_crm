import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  entityId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  entityType: { type: String, enum: ['student','teacher','staff'], required: true },
  date:       { type: String, required: true },
  status:     { type: String, enum: ['Present','Absent','Late'], required: true },
  branch:     { type: String },
  class:      { type: String },
  section:    { type: String },
  markedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

AttendanceSchema.index({ entityId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
