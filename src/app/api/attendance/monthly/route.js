import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');
    const month    = searchParams.get('month'); // e.g. "2025-01"
    const year     = searchParams.get('year');  // e.g. "2025"

    if (!entityId) return NextResponse.json({ error: 'entityId required' }, { status: 400 });

    let dateFilter = {};
    if (month) {
      dateFilter = { gte: `${month}-01`, lte: `${month}-31` };
    } else if (year) {
      dateFilter = { gte: `${year}-01-01`, lte: `${year}-12-31` };
    }

    const records = await prisma.attendance.findMany({
      where: {
        entityId,
        ...(Object.keys(dateFilter).length && { date: dateFilter }),
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (err) {
    console.error('[GET /api/attendance/monthly]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
