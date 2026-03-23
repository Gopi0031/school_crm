// src/lib/prisma.js
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}
