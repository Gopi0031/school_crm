import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Teacher from '@/models/Teacher';
import User from '@/models/User';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    const filter = {};
    if (branch) filter.branch = { $regex: new RegExp(`^${branch.trim()}$`, 'i') };

    const teachers = await Teacher.find(filter).sort({ name: 1 });
    return NextResponse.json({ success: true, data: teachers });
  } catch (err) {
    console.error('[GET /api/class-teacher]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { teacherId, assignedClass, section } = await req.json();

    if (!teacherId || !assignedClass || !section) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    // Check if another teacher is already class teacher for this class+section
    const existing = await Teacher.findOne({
      assignedClass,
      section,
      classTeacher: true,
      _id: { $ne: teacherId },
    });

    if (existing) {
      return NextResponse.json(
        { error: `${assignedClass}-${section} already has a class teacher: ${existing.name}` },
        { status: 400 }
      );
    }

    // Update the teacher
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { 
        $set: { 
          assignedClass, 
          section, 
          classTeacher: true,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // ✅ ALSO update the linked User record
    if (teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, {
        $set: {
          assignedClass,
          section,
          class: assignedClass,
        }
      });
      console.log('[Class Teacher] ✅ Updated user:', teacher.userId.toString(), { assignedClass, section });
    }

    return NextResponse.json({ success: true, data: teacher });
  } catch (err) {
    console.error('[POST /api/class-teacher]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const { teacherId, assignedClass, section } = await req.json();

    if (!teacherId || !assignedClass || !section) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    // Check if another teacher is already class teacher for this class+section
    const existing = await Teacher.findOne({
      assignedClass,
      section,
      classTeacher: true,
      _id: { $ne: teacherId },
    });

    if (existing) {
      return NextResponse.json(
        { error: `${assignedClass}-${section} already has a class teacher: ${existing.name}` },
        { status: 400 }
      );
    }

    // Update the teacher (reassign)
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { 
        $set: { 
          assignedClass, 
          section, 
          classTeacher: true,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // ✅ ALSO update the linked User record
    if (teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, {
        $set: {
          assignedClass,
          section,
          class: assignedClass,
        }
      });
      console.log('[Class Teacher] ✅ Updated user (reassign):', teacher.userId.toString(), { assignedClass, section });
    }

    return NextResponse.json({ success: true, data: teacher });
  } catch (err) {
    console.error('[PUT /api/class-teacher]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 });
    }

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { 
        $set: { 
          classTeacher: false, 
          assignedClass: '', 
          section: '',
          updatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // ✅ ALSO update the linked User record
    if (teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, {
        $set: {
          assignedClass: '',
          section: '',
          class: '',
        }
      });
      console.log('[Class Teacher] ✅ Removed user assignment:', teacher.userId.toString());
    }

    return NextResponse.json({ success: true, message: 'Assignment removed' });
  } catch (err) {
    console.error('[DELETE /api/class-teacher]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}