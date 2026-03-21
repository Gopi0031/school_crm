import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Branch from '@/models/Branch';
import Attendance from '@/models/Attendance';
import Report from '@/models/Report';

export async function GET() {
  try {
    await connectDB();
    const today = new Date().toISOString().split('T')[0];

    const [totalStudents, totalTeachers, totalBranches] = await Promise.all([
      Student.countDocuments({ status: 'Active' }),
      Teacher.countDocuments({ status: 'Active' }),
      Branch.countDocuments({ isActive: true }),
    ]);

    // Today's attendance
    const todayAtt = await Attendance.find({ date: today, entityType: 'student' });
    const presentToday = todayAtt.filter(a => a.status === 'Present').length;

    // Branch-wise students
    const branches = await Branch.find({ isActive: true });
    const branchStats = await Promise.all(branches.map(async b => {
      const students = await Student.find({ branchId: b._id });
      const present = students.filter(s => s.todayAttendance === 'Present').length;
      return { branch: b.name, students: students.length, present, absent: students.length - present };
    }));

    // Fee summary
    const feeData = await Student.aggregate([
      { $group: { _id: null, totalFee: { $sum: '$totalFee' }, paidFee: { $sum: '$paidFee' } } }
    ]);

    // Reports summary
    const reports = await Report.find({});
    const pass = reports.filter(r => r.status === 'Pass').length;
    const fail = reports.filter(r => r.status === 'Fail').length;

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalBranches,
        presentToday,
        absentToday: totalStudents - presentToday,
        totalFee: feeData[0]?.totalFee || 0,
        paidFee:  feeData[0]?.paidFee  || 0,
        dueFee:   (feeData[0]?.totalFee || 0) - (feeData[0]?.paidFee || 0),
        branchStats,
        passCount: pass,
        failCount: fail,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
