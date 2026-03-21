import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';

export async function POST(req) {
  try {
    await connectDB();
    const { records } = await req.json();
    if (!records?.length)
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });

    // ── Upsert each attendance record ──────────────────────
    const ops = records.map(r => ({
      updateOne: {
        filter: { entityId: r.entityId, entityType: r.entityType, date: r.date },
        update: { $set: r },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);

    // ── ✅ Recalculate & sync presentDays for each student ──
    if (records[0]?.entityType === 'student') {
      await Promise.all(
        records.map(async (r) => {
          // Count ALL present days for this student across all dates
          const presentCount = await Attendance.countDocuments({
            entityId:   r.entityId,
            entityType: 'student',
            status:     'Present',
          });
          const totalCount = await Attendance.countDocuments({
            entityId:   r.entityId,
            entityType: 'student',
          });

          await Student.findByIdAndUpdate(r.entityId, {
            $set: {
              presentDays:      presentCount,
              totalWorkingDays: totalCount,
              absentDays:       totalCount - presentCount,
            },
          });
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Bulk attendance error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
