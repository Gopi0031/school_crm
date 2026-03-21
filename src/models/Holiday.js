import mongoose from 'mongoose';

const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String },
  branch: { type: String, default: 'All' },
  academicYear: { type: String, default: '2024-25' },
}, { timestamps: true });

export default mongoose.models.Holiday || mongoose.model('Holiday', HolidaySchema);
