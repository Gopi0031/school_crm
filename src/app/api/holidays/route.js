import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear');
    const branch = searchParams.get('branch');

    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (branch) query.$or = [{ branch }, { branch: 'All' }];

    const holidays = await Holiday.find(query).sort({ date: 1 });
    return NextResponse.json({ success: true, data: holidays });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const holiday = await Holiday.create(body);
    return NextResponse.json({ success: true, data: holiday }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
