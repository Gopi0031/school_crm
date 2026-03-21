import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || '';

    const db = mongoose.connection.db;

    // ── Branch filter — case-insensitive ──────────────────
    const branchFilter = { branch: { $regex: new RegExp(`^${branch}$`, 'i') } };

    // ── Today as string (matches Attendance model) ────────
    const today = new Date().toISOString().split('T')[0];

    // ── 1. Students ───────────────────────────────────────
    const students = await db.collection('students')
      .find({ ...branchFilter })
      .toArray();

    const totalStudents  = students.length;
    const maleStudents   = students.filter(s => /^male$/i.test(s.gender)).length;
    const femaleStudents = students.filter(s => /^female$/i.test(s.gender)).length;
    const totalFee       = students.reduce((a, s) => a + (Number(s.totalFee) || 0), 0);
    const paidFee        = students.reduce((a, s) => a + (Number(s.paidFee)  || 0), 0);
    const dueFee         = totalFee - paidFee;

    // ── 2. Today's student attendance ─────────────────────
    // Supports BOTH entityType:'student' AND type:'student'
    const todayStudentAtt = await db.collection('attendances').find({
      ...branchFilter,
      date: today,
      $or: [{ entityType: 'student' }, { type: 'student' }],
    }).toArray();

    const presentStudents = todayStudentAtt.filter(a => a.status === 'Present').length;

    // Build entityId → status map
    const attMap = {};
    todayStudentAtt.forEach(a => {
      const id = String(a.entityId || a.studentId || '');
      if (id) attMap[id] = a.status;
    });

    // ── 3. Class-wise attendance breakdown ─────────────────
    // Built from students + attMap (no dependency on attendance.class field)
    const classMap = {};
    students.forEach(st => {
      const cls    = st.class || 'Unknown';
      const status = attMap[String(st._id)] || 'Absent';
      if (!classMap[cls]) classMap[cls] = { class: cls, present: 0, absent: 0 };
      if (status === 'Present') classMap[cls].present++;
      else                      classMap[cls].absent++;
    });
    const classWise = Object.values(classMap).sort((a, b) => {
      const n = x => parseInt(x.class?.replace(/\D/g, '') || 0);
      return n(a) - n(b);
    });

    // ── 4. Class-wise fee breakdown ───────────────────────
    const feeClsMap = {};
    students.forEach(st => {
      const cls  = st.class || 'Unknown';
      const paid = Number(st.paidFee)  || 0;
      const due  = (Number(st.totalFee) || 0) - paid;
      if (!feeClsMap[cls]) feeClsMap[cls] = { class: cls, paid: 0, due: 0 };
      feeClsMap[cls].paid += paid;
      feeClsMap[cls].due  += due;
    });
    const feeClassWise = Object.values(feeClsMap).sort((a, b) => {
      const n = x => parseInt(x.class?.replace(/\D/g, '') || 0);
      return n(a) - n(b);
    });

    // ── 5. Teachers ───────────────────────────────────────
    const teachers = await db.collection('teachers')
      .find({ ...branchFilter })
      .toArray();
    const totalTeachers = teachers.length;

    // ── 6. Pass / Fail — supports both 'result' and 'status' fields ──
    const reports = await db.collection('reports')
      .find({ ...branchFilter })
      .toArray();

    const passCount = reports.filter(r =>
      /^pass$/i.test(r.result || r.status || '')
    ).length;
    const failCount = reports.filter(r =>
      /^fail$/i.test(r.result || r.status || '')
    ).length;

    // ── 7. 6-month attendance trend ───────────────────────
    const sixMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month     = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const monthFrom = `${month}-01`;
      const monthTo   = `${month}-31`;
      const count = await db.collection('attendances').countDocuments({
        ...branchFilter,
        date:   { $gte: monthFrom, $lte: monthTo },
        status: 'Present',
        $or: [{ entityType: 'student' }, { type: 'student' }],
      });
      sixMonths.push({ month: month.slice(5), present: count });
    }

    return NextResponse.json({
      success: true,
      data: {
        // Student counts
        totalStudents,
        maleStudents,
        femaleStudents,
        presentStudents,
        // Attendance
        classWise,
        sixMonths,
        // Teachers
        totalTeachers,
        // Fee
        totalFee,
        paidFee,
        dueFee,
        feeClassWise,
        // Reports
        passCount,
        failCount,
      },
    });

  } catch (err) {
    console.error('[stats/branch-admin]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
