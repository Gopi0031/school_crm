import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear');
    const branch       = searchParams.get('branch');

    const holidays = await prisma.holiday.findMany({
      where: {
        ...(academicYear && { academicYear }),
        ...(branch       && { OR: [{ branch }, { branch: 'All' }] }),
      },
      orderBy: { date: 'asc' },
    });
    return NextResponse.json({ success: true, data: holidays });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body    = await req.json();
    const holiday = await prisma.holiday.create({ data: body });
    return NextResponse.json({ success: true, data: holiday }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
