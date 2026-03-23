import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch  = searchParams.get('branch');
    const cls     = searchParams.get('class');
    const section = searchParams.get('section');

    const today = new Date().toISOString().split('T')[0];

    const studentWhere = {
      ...(branch  && { branch }),
      ...(cls     && { class: cls }),
      ...(section && { section }),
    };

    const students = await prisma.student.findMany({ where: studentWhere });

    const todayAtt = await prisma.attendance.findMany({
      where: {
        entityType: 'student',
        date: today,
        ...studentWhere,
      },
    });

    const present = todayAtt.filter(a => a.status === 'Present').length;
    const absent  = students.length - present;

    // Pass percentage from reports
    const reports   = await prisma.report.findMany({ where: studentWhere });
    const passCount = reports.filter(r => r.status === 'Pass').length;
    const totalRep  = reports.length;
    const passPerc  = totalRep ? Math.round(passCount / totalRep * 100) : 0;

    // 6-month attendance trend
    const sixMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthAtt = await prisma.attendance.count({
        where: {
          entityType: 'student',
          status: 'Present',
          date: { gte: `${month}-01`, lte: `${month}-31` },
          ...(branch && { branch }),
          ...(cls    && { class: cls }),
        },
      });
      sixMonths.push({ month: month.slice(5), present: monthAtt });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalStudents:  students.length,
        maleStudents:   students.filter(s => s.gender === 'Male').length,
        femaleStudents: students.filter(s => s.gender === 'Female').length,
        presentToday:   present,
        absentToday:    absent,
        passPercentage: passPerc,
        totalFee:       students.reduce((a, s) => a + (s.totalFee || 0), 0),
        paidFee:        students.reduce((a, s) => a + (s.paidFee  || 0), 0),
        sixMonths,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
