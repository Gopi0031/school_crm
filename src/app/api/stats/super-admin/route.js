import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalStudents, totalTeachers, totalBranches] = await Promise.all([
      prisma.student.count({ where: { status: 'Active' } }),
      prisma.teacher.count({ where: { status: 'Active' } }),
      prisma.branch.count({ where: { isActive: true } }),
    ]);

    // Today's attendance
    const todayAtt = await prisma.attendance.findMany({
      where: { date: today, entityType: 'student' },
    });
    const presentToday = todayAtt.filter(a => a.status === 'Present').length;

    // Branch-wise students
    const branches = await prisma.branch.findMany({ where: { isActive: true } });
    const branchStats = await Promise.all(branches.map(async (b) => {
      const students = await prisma.student.findMany({ where: { branchId: b.id } });
      const present  = students.filter(s => s.todayAttendance === 'Present').length;
      return { branch: b.name, students: students.length, present, absent: students.length - present };
    }));

    // Fee summary
    const feeData = await prisma.student.aggregate({
      _sum: { totalFee: true, paidFee: true },
    });
    const totalFee = feeData._sum.totalFee || 0;
    const paidFee  = feeData._sum.paidFee  || 0;

    // Reports summary
    const [passCount, failCount] = await Promise.all([
      prisma.report.count({ where: { status: 'Pass' } }),
      prisma.report.count({ where: { status: 'Fail' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalStudents, totalTeachers, totalBranches,
        presentToday,
        absentToday: totalStudents - presentToday,
        totalFee, paidFee,
        dueFee: totalFee - paidFee,
        branchStats,
        passCount, failCount,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
