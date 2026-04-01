import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function getLastDayOfMonth(yearStr, monthStr) {
  return new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const date       = searchParams.get('date');
    const branch     = searchParams.get('branch');
    const cls        = searchParams.get('class');
    const section    = searchParams.get('section');
    const entityId   = searchParams.get('entityId');
    const from       = searchParams.get('from') || searchParams.get('startDate');
    const to         = searchParams.get('to') || searchParams.get('endDate');
    const month      = searchParams.get('month');

    console.log('📋 Attendance GET:', { entityType, date, entityId, month, branch, cls, section });

    const where = {};

    if (entityType) where.entityType = entityType;
    if (branch)     where.branch = branch;
    if (cls)        where.class = cls;
    if (section)    where.section = section;

    if (entityId) {
      if (!isValidObjectId(entityId)) {
        return NextResponse.json({ success: false, error: 'Invalid entityId' }, { status: 400 });
      }
      where.entityId = entityId;
    }

    // Date filtering
    if (date) {
      where.date = date;
    } else if (month) {
      // month = "2025-01"
      const [y, m] = month.split('-');
      const lastDay = getLastDayOfMonth(y, m);
      where.date = {
        gte: `${month}-01`,
        lte: `${month}-${String(lastDay).padStart(2, '0')}`,
      };
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to)   where.date.lte = to;
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    console.log(`✅ Found ${records.length} attendance records`);

    return NextResponse.json({ success: true, data: records });
  } catch (err) {
    console.error('❌ GET attendance error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.entityId || !body.date) {
      return NextResponse.json({ success: false, error: 'entityId and date required' }, { status: 400 });
    }

    if (!isValidObjectId(body.entityId)) {
      return NextResponse.json({ success: false, error: 'Invalid entityId' }, { status: 400 });
    }

    const record = await prisma.attendance.upsert({
      where: { entityId_date: { entityId: body.entityId, date: body.date } },
      update: {
        status:     body.status || 'Absent',
        entityType: body.entityType || 'student',
        branch:     body.branch || '',
        class:      body.class || '',
        section:    body.section || '',
        markedBy:   body.markedBy || '',
      },
      create: {
        entityId:   body.entityId,
        entityType: body.entityType || 'student',
        date:       body.date,
        status:     body.status || 'Absent',
        branch:     body.branch || '',
        class:      body.class || '',
        section:    body.section || '',
        markedBy:   body.markedBy || '',
      },
    });

    // Recalculate student counts
    if (body.entityType === 'student') {
      try {
        const allRecords = await prisma.attendance.findMany({
          where: { entityId: body.entityId, entityType: 'student' },
          select: { status: true },
        });

        await prisma.student.update({
          where: { id: body.entityId },
          data: {
            presentDays:      allRecords.filter(a => a.status === 'Present').length,
            absentDays:       allRecords.filter(a => a.status === 'Absent').length,
            totalWorkingDays: allRecords.length,
            todayAttendance:  body.status,
          },
        });
      } catch (e) {
        console.log('⚠️ Could not update student:', e.message);
      }
    }

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err) {
    console.error('❌ POST attendance error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}