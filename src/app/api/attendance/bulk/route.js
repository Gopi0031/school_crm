import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function POST(req) {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    const { records } = await req.json();
    
    console.log('[Bulk Attendance] Received records:', records?.length);
    
    if (!records?.length) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    // ✅ Validate and filter records
    const validRecords = records.filter(r => {
      if (!r.entityId) {
        console.warn('[Bulk Attendance] Missing entityId:', r);
        return false;
      }
      return true;
    });

    if (validRecords.length === 0) {
      return NextResponse.json({ 
        error: 'No valid records - all records are missing entityId' 
      }, { status: 400 });
    }

    console.log('[Bulk Attendance] Valid records:', validRecords.length);

    // ── Save to Prisma attendance table ──
    const results = await Promise.all(
      validRecords.map(r => {
        const entityId = String(r.entityId);
        const date = r.date;
        
        return prisma.attendance.upsert({
          where: { 
            entityId_date: { entityId, date } 
          },
          update: { 
            entityType: r.entityType || 'student',
            status: r.status,
            branch: r.branch || '',
            class: r.class || '',
            section: r.section || '',
            markedBy: r.markedBy || '',
          },
          create: { 
            entityId,
            entityType: r.entityType || 'student',
            date,
            status: r.status,
            branch: r.branch || '',
            class: r.class || '',
            section: r.section || '',
            markedBy: r.markedBy || '',
          },
        });
      })
    );

    // ── Also update student records (for quick access) ──
    const studentUpdates = validRecords
      .filter(r => r.entityType === 'student')
      .map(r => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(r.entityId) },
          update: { $set: { todayAttendance: r.status } }
        }
      }));

    if (studentUpdates.length > 0) {
      try {
        await db.collection('students').bulkWrite(studentUpdates);
        console.log('[Bulk Attendance] Updated student records:', studentUpdates.length);
      } catch (updateErr) {
        console.warn('[Bulk Attendance] Student update warning:', updateErr.message);
      }
    }

    console.log('[Bulk Attendance] ✅ Saved:', results.length);

    return NextResponse.json({ 
      success: true, 
      message: `${validRecords.length} attendance record(s) saved`,
      count: results.length
    });

  } catch (err) {
    console.error('[Bulk Attendance] ❌ Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to save attendance' 
    }, { status: 500 });
  }
}