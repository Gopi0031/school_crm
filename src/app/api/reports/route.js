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

    const where = {};
    if (studentId)    where.studentId    = studentId;
    if (cls)          where.class        = cls;
    if (section)      where.section      = section;
    if (branch)       where.branch       = branch;
    if (exam)         where.exam         = exam;
    if (academicYear) where.academicYear = academicYear;
    
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { rollNo:      { contains: search, mode: 'insensitive' } },
        { subject:     { contains: search, mode: 'insensitive' } },
      ];
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: [{ class: 'asc' }, { rollNo: 'asc' }, { subject: 'asc' }],
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (err) {
    console.error('[GET /api/reports]', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // ── Bulk Insert (Array) ────────────────────────────────
    if (Array.isArray(body)) {
      const processed = body.map(r => {
        const pct = r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0;
        return {
          ...r,
          percentage: pct,
          status: pct >= 35 ? 'Pass' : 'Fail',
          marksObtained: Number(r.marksObtained) || 0,
          totalMarks: Number(r.totalMarks) || 100,
        };
      });

      let upserted = 0;
      const results = await Promise.allSettled(
        processed.map(async (r) => {
          const result = await prisma.report.upsert({
            where: {
              studentId_subject_exam: {
                studentId: r.studentId,
                subject: r.subject,
                exam: r.exam || 'Annual',
              },
            },
            update: {
              marksObtained: r.marksObtained,
              totalMarks: r.totalMarks,
              percentage: r.percentage,
              status: r.status,
              academicYear: r.academicYear,
              updatedAt: new Date(),
            },
            create: r,
          });
          if (result) upserted++;
          return result;
        })
      );

      return NextResponse.json({
        success: true,
        upserted,
        total: processed.length,
      });
    }

    // ── Single Insert ──────────────────────────────────────
    const marksObtained = Number(body.marksObtained) || 0;
    const totalMarks = Number(body.totalMarks) || 100;
    const pct = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;

    const reportData = {
      ...body,
      marksObtained,
      totalMarks,
      percentage: pct,
      status: pct >= 35 ? 'Pass' : 'Fail',
    };

    // Auto-fill student details if missing
    if (body.studentId && (!body.studentName || !body.rollNo)) {
      const student = await prisma.student.findUnique({
        where: { id: body.studentId },
        select: { name: true, rollNo: true, class: true, section: true, branch: true },
      });

      if (student) {
        reportData.studentName = reportData.studentName || student.name;
        reportData.rollNo = reportData.rollNo || student.rollNo;
        reportData.class = reportData.class || student.class;
        reportData.section = reportData.section || student.section;
        reportData.branch = reportData.branch || student.branch;
      }
    }

    const report = await prisma.report.create({ data: reportData });

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/reports]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}