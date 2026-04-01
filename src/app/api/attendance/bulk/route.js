import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function POST(req) {
  try {
    const { records } = await req.json();

    console.log('📝 Bulk attendance:', records?.length, 'records');

    if (!records?.length) {
      return NextResponse.json({ success: false, error: 'No records provided' }, { status: 400 });
    }

    const validRecords = records.filter(r =>
      r.entityId && isValidObjectId(r.entityId) && r.date
    );

    if (!validRecords.length) {
      return NextResponse.json({ success: false, error: 'No valid records' }, { status: 400 });
    }

    // Upsert all attendance records
    const results = await Promise.all(
      validRecords.map(async (r) => {
        try {
          return await prisma.attendance.upsert({
            where: {
              entityId_date: {
                entityId: r.entityId,
                date: r.date
              }
            },
            update: {
              entityType: r.entityType || 'student',
              status:     r.status || 'Absent',
              branch:     r.branch || '',
              class:      r.class || '',
              section:    r.section || '',
              markedBy:   r.markedBy || '',
            },
            create: {
              entityId:   r.entityId,
              entityType: r.entityType || 'student',
              date:       r.date,
              status:     r.status || 'Absent',
              branch:     r.branch || '',
              class:      r.class || '',
              section:    r.section || '',
              markedBy:   r.markedBy || '',
            },
          });
        } catch (err) {
          console.error('❌ Failed:', r.entityId, err.message);
          return null;
        }
      })
    );

    const savedCount = results.filter(Boolean).length;
    console.log(`✅ Saved ${savedCount} attendance records`);

    // ── Recalculate student counts from actual attendance data ──
    const studentIds = [...new Set(
      validRecords
        .filter(r => r.entityType === 'student')
        .map(r => r.entityId)
    )];

    if (studentIds.length > 0) {
      console.log('🔄 Recalculating counts for', studentIds.length, 'students');

      await Promise.allSettled(
        studentIds.map(async (studentId) => {
          try {
            // Count ALL attendance records for this student
            const allRecords = await prisma.attendance.findMany({
              where: { entityId: studentId, entityType: 'student' },
              select: { status: true },
            });

            const presentDays    = allRecords.filter(a => a.status === 'Present').length;
            const absentDays     = allRecords.filter(a => a.status === 'Absent').length;
            const totalWorkingDays = allRecords.length;

            // Get today's status
            const todayStr = new Date().toISOString().split('T')[0];
            const todayRecord = allRecords.length > 0
              ? (await prisma.attendance.findUnique({
                  where: { entityId_date: { entityId: studentId, date: todayStr } }
                }))
              : null;

            await prisma.student.update({
              where: { id: studentId },
              data: {
                presentDays,
                absentDays,
                totalWorkingDays,
                todayAttendance: todayRecord?.status || '',
              },
            });

            console.log(`✅ ${studentId}: P=${presentDays} A=${absentDays} T=${totalWorkingDays}`);
          } catch (e) {
            console.log('⚠️ Could not update student:', studentId, e.message);
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      message: `${savedCount} attendance record(s) saved`,
      count: savedCount,
    });
  } catch (err) {
    console.error('❌ Bulk attendance error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}