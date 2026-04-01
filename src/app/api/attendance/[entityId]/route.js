import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to validate MongoDB ObjectId
function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function GET(req, { params }) {
  try {
    const { entityId } = params;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year  = searchParams.get('year');

    if (!entityId) {
      return NextResponse.json({ 
        success: false, 
        error: 'entityId required' 
      }, { status: 400 });
    }

    // Validate entityId
    if (!isValidObjectId(entityId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid entityId format' 
      }, { status: 400 });
    }

    let dateFilter = {};
    if (month) {
      const [y, m] = month.split('-');
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      dateFilter = { 
        gte: `${month}-01`, 
        lte: `${month}-${String(lastDay).padStart(2, '0')}` 
      };
    } else if (year) {
      dateFilter = { 
        gte: `${year}-01-01`, 
        lte: `${year}-12-31` 
      };
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
    console.error('❌ GET attendance by entityId error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}