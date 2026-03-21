import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const date       = searchParams.get('date');
    const branch     = searchParams.get('branch');
    const cls        = searchParams.get('class');
    const section    = searchParams.get('section');
    const entityId   = searchParams.get('entityId');
    const from       = searchParams.get('from');
    const to         = searchParams.get('to');

    const query = {};
    if (entityType) query.entityType = entityType;
    if (branch)     query.branch     = branch;
    if (cls)        query.class      = cls;
    if (section)    query.section    = section;
    if (entityId)   query.entityId   = entityId;

    if (date) {
      query.date = date;
    } else if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to)   query.date.$lte = to;
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    return NextResponse.json({ success: true, data: records });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const record = await Attendance.findOneAndUpdate(
      { entityId: body.entityId, date: body.date },
      { $set: body },
      { upsert: true, new: true }
    );
    // Update todayAttendance on Student for quick dashboard access
    if (body.entityType === 'student') {
      await Student.findByIdAndUpdate(body.entityId, {
        todayAttendance: body.status,
      });
    }
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
