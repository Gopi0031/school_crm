import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [students, teachers, branches, todayAttendance, passCount, failCount] =
      await Promise.all([
        prisma.student.findMany(),
        prisma.teacher.findMany(),
        prisma.branch.findMany({ where: { isActive: true } }),
        prisma.attendance.findMany({ where: { date: today, entityType: 'student' } }),
        prisma.report.count({ where: { status: 'Pass' } }),
        prisma.report.count({ where: { status: 'Fail' } }),
      ]);

    const totalStudents  = students.length;
    const totalTeachers  = teachers.length;
    const activeTeachers = teachers.filter(t => t.status === 'Active' || !t.status).length;
    const totalBranches  = branches.length;
    const maleStudents   = students.filter(s => s.gender?.toLowerCase() === 'male').length;
    const femaleStudents = students.filter(s => s.gender?.toLowerCase() === 'female').length;
    const presentToday   = todayAttendance.filter(a => a.status === 'Present').length;
    const absentToday    = todayAttendance.filter(a => a.status === 'Absent').length;

    const totalFee = students.reduce((a, s) => a + (s.totalFee || 0), 0);
    const paidFee  = students.reduce((a, s) => a + (s.paidFee  || 0), 0);
    const dueFee   = totalFee - paidFee;

    // ── Branch-wise stats ──
    const branchStats = branches.map(b => {
      const branchStudents   = students.filter(s => s.branch === b.name);
      const branchAttendance = todayAttendance.filter(a => a.branch === b.name);
      return {
        branch:   b.name,
        students: branchStudents.length,
        present:  branchAttendance.filter(a => a.status === 'Present').length,
        absent:   branchAttendance.filter(a => a.status === 'Absent').length,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalStudents, totalTeachers, activeTeachers, totalBranches,
        maleStudents, femaleStudents,
        presentToday, absentToday,
        totalFee, paidFee, dueFee,
        branchStats, passCount, failCount,
      },
    });
  } catch (err) {
    console.error('[Super Admin Stats] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
