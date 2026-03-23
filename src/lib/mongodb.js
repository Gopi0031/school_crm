import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri);
};

export default connectDB;
