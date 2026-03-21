import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Report from '@/models/Report';
import mongoose from 'mongoose';

export async function POST(req) {
  try {
    await connectDB();
    const { ids } = await req.json();
    if (!ids?.length) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });

    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    const result    = await Report.deleteMany({ _id: { $in: objectIds } });

    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
