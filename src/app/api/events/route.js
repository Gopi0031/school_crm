import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const cls    = searchParams.get('class');

    const events = await prisma.event.findMany({
      where: {
        ...(branch && { OR: [{ branch }, { branch: 'All' }] }),
        ...(cls    && { OR: [{ class: cls }, { class: 'All' }] }),
      },
      orderBy: { date: 'asc' },
    });
    return NextResponse.json({ success: true, data: events });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body  = await req.json();
    const event = await prisma.event.create({ data: body });
    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
