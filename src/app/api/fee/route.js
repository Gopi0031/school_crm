import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branch  = searchParams.get('branch');
    const cls     = searchParams.get('class');
    const section = searchParams.get('section');
    const branchId = searchParams.get('branchId');

    const query = {};
    if (branch)   query.branch   = branch;
    if (branchId) query.branchId = branchId;
    if (cls)      query.class    = cls;
    if (section)  query.section  = section;

    const students = await Student.find(query).select('name rollNo class section branch totalFee paidFee term1 term2 term3 phone parentName status');
    const summary  = {
      totalFee:   students.reduce((a,s) => a+s.totalFee, 0),
      paidFee:    students.reduce((a,s) => a+s.paidFee,  0),
      pendingFee: students.reduce((a,s) => a+(s.totalFee-s.paidFee), 0),
    };
    return NextResponse.json({ success: true, data: students, summary });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { studentId, term1, term2, term3 } = await req.json();
    const student = await Student.findById(studentId);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    if (term1 !== undefined) student.term1 = Number(term1);
    if (term2 !== undefined) student.term2 = Number(term2);
    if (term3 !== undefined) student.term3 = Number(term3);
    student.paidFee = student.term1 + student.term2 + student.term3;
    await student.save();

    return NextResponse.json({ success: true, data: student });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
