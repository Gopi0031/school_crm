import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const cls    = searchParams.get('class');
    const query  = {};
    if (branch) query.$or = [{ branch }, { branch: 'All' }];
    if (cls)    query.$or = [...(query.$or||[]), { class: cls }, { class: 'All' }];
    const events = await Event.find(query).sort({ date: 1 });
    return NextResponse.json({ success: true, data: events });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body  = await req.json();
    const event = await Event.create(body);
    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
