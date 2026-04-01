import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || '';
    const today  = new Date().toISOString().split('T')[0];

    const branchFilter = { branch: { equals: branch, mode: 'insensitive' } };

    // ── Students ──
    const students      = await prisma.student.findMany({ where: branchFilter });
    const totalStudents = students.length;
    const maleStudents  = students.filter(s => /^male$/i.test(s.gender)).length;
    const femaleStudents= students.filter(s => /^female$/i.test(s.gender)).length;
    const totalFee      = students.reduce((a, s) => a + (s.totalFee || 0), 0);
    const paidFee       = students.reduce((a, s) => a + (s.paidFee  || 0), 0);
    const dueFee        = totalFee - paidFee;

    // ── Today's attendance ──
    const todayAtt = await prisma.attendance.findMany({
      where: { ...branchFilter, date: today, entityType: 'student' },
    });
    const presentStudents = todayAtt.filter(a => a.status === 'Present').length;

    // ── Build attMap ──
    const attMap = {};
    todayAtt.forEach(a => { attMap[a.entityId] = a.status; });

    // ── Class-wise attendance ──
    const classMap = {};
    students.forEach(st => {
      const cls    = st.class || 'Unknown';
      const status = attMap[st.id] || 'Absent';
      if (!classMap[cls]) classMap[cls] = { class: cls, present: 0, absent: 0 };
      if (status === 'Present') classMap[cls].present++;
      else                      classMap[cls].absent++;
    });
    const classWise = Object.values(classMap).sort((a, b) => {
      const n = x => parseInt(x.class?.replace(/\D/g, '') || 0);
      return n(a) - n(b);
    });

    // ── Class-wise fee ──
    const feeClsMap = {};
    students.forEach(st => {
      const cls  = st.class || 'Unknown';
      const paid = st.paidFee  || 0;
      const due  = (st.totalFee || 0) - paid;
      if (!feeClsMap[cls]) feeClsMap[cls] = { class: cls, paid: 0, due: 0 };
      feeClsMap[cls].paid += paid;
      feeClsMap[cls].due  += due;
    });
    const feeClassWise = Object.values(feeClsMap).sort((a, b) => {
      const n = x => parseInt(x.class?.replace(/\D/g, '') || 0);
      return n(a) - n(b);
    });

    // ── Teachers ──
    const totalTeachers = await prisma.teacher.count({ where: branchFilter });

    // ── Reports ──
    const [passCount, failCount] = await Promise.all([
      prisma.report.count({ where: { branch, status: 'Pass' } }),
      prisma.report.count({ where: { branch, status: 'Fail' } }),
    ]);

    // ── 6-month attendance trend ──
    const sixMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = await prisma.attendance.count({
        where: {
          branch,
          entityType: 'student',
          status:     'Present',
          date:       { gte: `${month}-01`, lte: `${month}-31` },
        },
      });
      sixMonths.push({ month: month.slice(5), present: count });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalStudents, maleStudents, femaleStudents,
        presentStudents,
        classWise, sixMonths,
        totalTeachers,
        totalFee, paidFee, dueFee,
        feeClassWise,
        passCount, failCount,
      },
    });
  } catch (err) {
    console.error('[stats/branch-admin]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
