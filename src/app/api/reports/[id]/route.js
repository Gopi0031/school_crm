import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Report from '@/models/Report';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id }  = await params;
    const body    = await req.json();
    const pct     = body.totalMarks ? Math.round(body.marksObtained / body.totalMarks * 100) : 0;
    body.percentage = pct;
    body.status     = pct >= 35 ? 'Pass' : 'Fail';
    const report  = await Report.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: report });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const report = await Report.findByIdAndDelete(id);
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
