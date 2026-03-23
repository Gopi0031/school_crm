import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const holiday = await prisma.holiday.update({ where: { id }, data: body });
    if (!holiday) return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: holiday });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const holiday = await prisma.holiday.delete({ where: { id } });
    if (!holiday) return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Holiday deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
