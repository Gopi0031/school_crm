import mongoose from 'mongoose';

const PeriodSchema = new mongoose.Schema({
  periodNo:  { type: Number },
  subject:   { type: String, default: '' },
  teacher:   { type: String, default: '' },
  startTime: { type: String, default: '' },
  endTime:   { type: String, default: '' },
}, { _id: false }); // ✅ no _id on subdocs

const DaySchema = new mongoose.Schema({
  day:     { type: String },
  periods: [PeriodSchema],
}, { _id: false }); // ✅ no _id on subdocs

const TimetableSchema = new mongoose.Schema({
  branch:    { type: String, required: true },
  class:     { type: String, required: true },
  section:   { type: String, required: true },
  days:      [DaySchema],
  updatedBy: { type: String, default: '' },
}, { timestamps: true });

// ✅ Compound index — NOT unique: true to avoid upsert E11000 errors
TimetableSchema.index({ branch: 1, class: 1, section: 1 }, { unique: true });

export default mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);
