import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');
    const month    = searchParams.get('month'); // e.g. "2025-01"
    const year     = searchParams.get('year');  // e.g. "2025"

    if (!entityId) return NextResponse.json({ error: 'entityId required' }, { status: 400 });

    const query = { entityId };
    if (month) {
      query.date = { $gte: `${month}-01`, $lte: `${month}-31` };
    } else if (year) {
      query.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
    }

    const records = await Attendance.find(query).sort({ date: 1 });
    return NextResponse.json({ success: true, data: records });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
