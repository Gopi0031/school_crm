import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const body = await req.json();
    const holiday = await Holiday.findByIdAndUpdate(params.id, body, { new: true });
    if (!holiday) return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: holiday });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const holiday = await Holiday.findByIdAndDelete(params.id);
    if (!holiday) return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Holiday deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
