import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { records } = await req.json();

    if (!records?.length)
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });

    const validRecords = records.filter(r => {
      if (!r.entityId) { console.warn('[Bulk Attendance] Missing entityId:', r); return false; }
      return true;
    });

    if (!validRecords.length)
      return NextResponse.json({ error: 'No valid records - all missing entityId' }, { status: 400 });

    // ── Upsert attendance records ──
    const results = await Promise.all(
      validRecords.map(r =>
        prisma.attendance.upsert({
          where:  { entityId_date: { entityId: String(r.entityId), date: r.date } },
          update: {
            entityType: r.entityType || 'student',
            status:     r.status,
            branch:     r.branch   || '',
            class:      r.class    || '',
            section:    r.section  || '',
            markedBy:   r.markedBy || '',
          },
          create: {
            entityId:   String(r.entityId),
            entityType: r.entityType || 'student',
            date:       r.date,
            status:     r.status,
            branch:     r.branch   || '',
            class:      r.class    || '',
            section:    r.section  || '',
            markedBy:   r.markedBy || '',
          },
        })
      )
    );

    // ── Also update todayAttendance on Student record ──
    const studentRecords = validRecords.filter(r => r.entityType === 'student');
    if (studentRecords.length) {
      await Promise.allSettled(
        studentRecords.map(r =>
          prisma.student.update({
            where: { id: String(r.entityId) },
            data:  { todayAttendance: r.status },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} attendance record(s) saved`,
      count:   results.length,
    });
  } catch (err) {
    console.error('[Bulk Attendance] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save attendance' }, { status: 500 });
  }
}
