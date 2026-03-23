import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId   = searchParams.get('studentId');
    const cls         = searchParams.get('class');
    const section     = searchParams.get('section');
    const branch      = searchParams.get('branch');
    const exam        = searchParams.get('exam');
    const academicYear = searchParams.get('academicYear');
    const search      = searchParams.get('search');

    const reports = await prisma.report.findMany({
      where: {
        ...(studentId    && { studentId }),
        ...(cls          && { class: cls }),
        ...(section      && { section }),
        ...(branch       && { branch }),
        ...(exam         && { exam }),
        ...(academicYear && { academicYear }),
        ...(search && {
          OR: [
            { studentName: { contains: search, mode: 'insensitive' } },
            { rollNo:      { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ class: 'asc' }, { rollNo: 'asc' }],
    });
    return NextResponse.json({ success: true, data: reports });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Bulk array
    if (Array.isArray(body)) {
      const processed = body.map(r => {
        const pct = r.totalMarks ? Math.round(r.marksObtained / r.totalMarks * 100) : 0;
        return { ...r, percentage: pct, status: pct >= 35 ? 'Pass' : 'Fail' };
      });

      let upserted = 0, modified = 0;
      await Promise.all(processed.map(async r => {
        const result = await prisma.report.upsert({
          where:  { studentId_subject_exam: { studentId: r.studentId, subject: r.subject, exam: r.exam || 'Annual' } },
          update: r,
          create: r,
        });
        result ? upserted++ : modified++;
      }));
      return NextResponse.json({ success: true, upserted, modified });
    }

    // Single record
    const pct = body.totalMarks ? Math.round(body.marksObtained / body.totalMarks * 100) : 0;
    body.percentage = pct;
    body.status     = pct >= 35 ? 'Pass' : 'Fail';

    if (body.studentId && (!body.studentName || !body.rollNo)) {
      const student = await prisma.student.findUnique({ where: { id: body.studentId } });
      if (student) {
        body.studentName = body.studentName || student.name;
        body.rollNo      = body.rollNo      || student.rollNo;
        body.class       = body.class       || student.class;
        body.section     = body.section     || student.section;
        body.branch      = body.branch      || student.branch;
      }
    }

    const report = await prisma.report.create({ data: body });
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
