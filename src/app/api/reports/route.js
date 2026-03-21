import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Report from '@/models/Report';
import Student from '@/models/Student';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const studentId   = searchParams.get('studentId');
    const cls         = searchParams.get('class');
    const section     = searchParams.get('section');
    const branch      = searchParams.get('branch');
    const exam        = searchParams.get('exam');
    const academicYear = searchParams.get('academicYear');
    const search      = searchParams.get('search');

    const query = {};
    if (studentId)   query.studentId   = studentId;
    if (cls)         query.class       = cls;
    if (section)     query.section     = section;
    if (branch)      query.branch      = branch;
    if (exam)        query.exam        = exam;
    if (academicYear) query.academicYear = academicYear;
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { rollNo:      { $regex: search, $options: 'i' } },
      ];
    }

    const reports = await Report.find(query).sort({ class: 1, rollNo: 1 });
    return NextResponse.json({ success: true, data: reports });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // If bulk array
    if (Array.isArray(body)) {
      const processed = body.map(r => {
        const pct = r.totalMarks ? Math.round(r.marksObtained / r.totalMarks * 100) : 0;
        return { ...r, percentage: pct, status: pct >= 35 ? 'Pass' : 'Fail' };
      });
      const ops = processed.map(r => ({
        updateOne: {
          filter: { studentId: r.studentId, subject: r.subject, exam: r.exam || 'Annual' },
          update: { $set: r },
          upsert: true,
        },
      }));
      const result = await Report.bulkWrite(ops);
      return NextResponse.json({ success: true, upserted: result.upsertedCount, modified: result.modifiedCount });
    }

    // Single record
    const pct = body.totalMarks ? Math.round(body.marksObtained / body.totalMarks * 100) : 0;
    body.percentage = pct;
    body.status     = pct >= 35 ? 'Pass' : 'Fail';

    // Auto-fill student info if studentId provided
    if (body.studentId && (!body.studentName || !body.rollNo)) {
      const student = await Student.findById(body.studentId);
      if (student) {
        body.studentName = body.studentName || student.name;
        body.rollNo      = body.rollNo      || student.rollNo;
        body.class       = body.class       || student.class;
        body.section     = body.section     || student.section;
        body.branch      = body.branch      || student.branch;
      }
    }

    const report = await Report.create(body);
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
