import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  date:         { type: String, required: true },
  startTime:    { type: String },
  endTime:      { type: String },
  description:  { type: String },
  branch:       { type: String, default: 'All' },
  class:        { type: String, default: 'All' },
  section:      { type: String, default: 'All' },
  academicYear: { type: String, default: '2024-25' },
  notificationSent: { type: Boolean, default: false },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
