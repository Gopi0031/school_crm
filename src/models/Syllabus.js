import mongoose from 'mongoose';

const TopicSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  status:    { type: String, enum: ['pending','in-progress','completed'], default: 'pending' },
  completedOn: { type: Date, default: null },
});

const UnitSchema = new mongoose.Schema({
  unitNo:  { type: Number, required: true },
  title:   { type: String, required: true },
  topics:  [TopicSchema],
});

const SyllabusSchema = new mongoose.Schema({
  branch:   { type: String, required: true },
  class:    { type: String, required: true },
  subject:  { type: String, required: true },
  units:    [UnitSchema],
  updatedBy: { type: String, default: '' },
}, { timestamps: true });

SyllabusSchema.index({ branch: 1, class: 1, subject: 1 }, { unique: true });
export default mongoose.models.Syllabus || mongoose.model('Syllabus', SyllabusSchema);
