import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch') || '';
    // Store settings in a simple way — use a Setting model or fallback
    return NextResponse.json({ success: true, data: { academicYear: '2025-26', branch } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { branch = '', academicYear } = await req.json();
    if (!academicYear) return NextResponse.json({ error: 'academicYear is required' }, { status: 400 });

    // Update teachers
    const teacherResult = await prisma.teacher.updateMany({
      where: { ...(branch && { branch }), status: 'Active' },
      data: { academicYear },
    });

    // Reset student fees for new year
    const studentResult = await prisma.student.updateMany({
      where: branch ? { branch } : {},
      data: { academicYear, term1: 0, term2: 0, term3: 0, paidFee: 0, term1Due: 0, term2Due: 0, term3Due: 0 },
    });

    return NextResponse.json({
      success: true,
      message: `Year updated. ${teacherResult.count} teacher(s) and ${studentResult.count} student(s) promoted.`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
