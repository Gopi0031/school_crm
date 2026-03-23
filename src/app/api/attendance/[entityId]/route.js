import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');
    const month    = searchParams.get('month');
    const year     = searchParams.get('year');

    if (!entityId) return NextResponse.json({ error: 'entityId required' }, { status: 400 });

    const records = await prisma.attendance.findMany({
      where: {
        entityId,
        ...(month && { date: { gte: `${month}-01`, lte: `${month}-31` } }),
        ...(!month && year && { date: { gte: `${year}-01-01`, lte: `${year}-12-31` } }),
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
