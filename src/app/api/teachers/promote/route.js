import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { newAcademicYear, branch } = await req.json();
    if (!newAcademicYear) return NextResponse.json({ error: 'newAcademicYear is required' }, { status: 400 });

    const result = await prisma.teacher.updateMany({
      where: { ...(branch && { branch }), status: 'Active' },
      data: { academicYear: newAcademicYear },
    });

    return NextResponse.json({ success: true, message: `${result.count} teacher(s) updated`, updated: result.count });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
