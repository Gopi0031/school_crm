import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { records } = await req.json();
    
    console.log('[Bulk Attendance] Received records:', records?.length);
    
    if (!records?.length) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    // ✅ Validate and filter records - ensure entityId exists
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
    console.log('[Bulk Attendance] Sample:', validRecords[0]);

    // Upsert all records
    const results = await Promise.all(
      validRecords.map(r => {
        const entityId = String(r.entityId);
        const date = r.date;
        
        return prisma.attendance.upsert({
          where: { 
            entityId_date: { 
              entityId, 
              date 
            } 
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