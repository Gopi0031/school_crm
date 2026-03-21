import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Teacher from '@/models/Teacher';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const query = {};
    if (branch) query.branch = branch;
    const teachers = await Teacher.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: teachers });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { teacherId, assignedClass, section } = await req.json();

    if (!teacherId || !assignedClass || !section)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });

    // ✅ FIXED: "_id" not "id"
    const existing = await Teacher.findOne({
      assignedClass,
      section,
      classTeacher: true,
      _id: { $ne: teacherId },
    });

    if (existing)
      return NextResponse.json(
        { error: `${assignedClass}-${section} already has a class teacher: ${existing.name}` },
        { status: 400 }
      );

    // ✅ FIXED: added $set wrapper
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { $set: { assignedClass, section, classTeacher: true } },
      { new: true }
    );

    if (!teacher)
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: teacher });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');

    // ✅ FIXED: added $set and also clear assignedClass/section
    await Teacher.findByIdAndUpdate(
      teacherId,
      { $set: { classTeacher: false, assignedClass: '', section: '' } }
    );

    return NextResponse.json({ success: true, message: 'Assignment removed' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
