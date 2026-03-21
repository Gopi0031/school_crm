import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const body  = await req.json();
    const event = await Event.findByIdAndUpdate(params.id, body, { new: true });
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: event });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    await Event.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
