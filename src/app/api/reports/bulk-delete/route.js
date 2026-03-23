import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { ids } = await req.json();
    if (!ids?.length) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });

    const result = await prisma.report.deleteMany({
      where: { id: { in: ids } },
    });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
