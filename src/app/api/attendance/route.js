import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const date       = searchParams.get('date');
    const branch     = searchParams.get('branch');
    const cls        = searchParams.get('class');
    const section    = searchParams.get('section');
    const entityId   = searchParams.get('entityId');
    const from       = searchParams.get('from');
    const to         = searchParams.get('to');

    const records = await prisma.attendance.findMany({
      where: {
        ...(entityType && { entityType }),
        ...(branch     && { branch }),
        ...(cls        && { class: cls }),
        ...(section    && { section }),
        ...(entityId   && { entityId }),
        ...(date       && { date }),
        ...(!date && (from || to) && {
          date: {
            ...(from && { gte: from }),
            ...(to   && { lte: to }),
          },
        }),
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const record = await prisma.attendance.upsert({
      where:  { entityId_date: { entityId: body.entityId, date: body.date } },
      update: { ...body },
      create: { ...body },
    });

    if (body.entityType === 'student') {
      await prisma.student.update({
        where: { id: body.entityId },
        data:  { todayAttendance: body.status },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
