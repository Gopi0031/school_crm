import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, default: '' },
  phone:    { type: String, default: '' },
  address:  { type: String, default: '' },
  adminId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Branch || mongoose.model('Branch', BranchSchema);
