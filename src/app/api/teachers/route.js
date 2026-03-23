import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/prisma';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

function generateEmployeeId(name) {
  const prefix = name.replace(/\s+/g, '').toUpperCase().slice(0, 3) || 'TCH';
  return `${prefix}${Date.now().toString().slice(-4)}`;
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const branch  = searchParams.get('branch')  || '';
    const cls     = searchParams.get('class')   || '';
    const section = searchParams.get('section') || '';

    const collection = mongoose.connection.db.collection('teachers');
    const filter = {};
    if (branch.trim())  filter.branch  = { $regex: new RegExp(`^${branch.trim()}$`, 'i') };
    if (cls.trim())     filter.class   = cls.trim();
    if (section.trim()) filter.section = section.trim();

    const teachers = await collection.find(filter).sort({ name: 1 }).toArray();
    return NextResponse.json({ success: true, data: teachers });
  } catch (err) {
    console.error('[GET /api/teachers]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { 
      username, password, confirmPassword, branch, branchId,
      classTeacher, assignedClass,  // ✅ Class teacher fields
      ...rest 
    } = body;

    if (!rest.name)    return NextResponse.json({ error: 'Name is required' },     { status: 400 });
    if (!username)     return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    if (!password)     return NextResponse.json({ error: 'Password is required' }, { status: 400 });

    const teachersCol = mongoose.connection.db.collection('teachers');
    const usersCol    = mongoose.connection.db.collection('users');

    // Check username uniqueness
    const exists = await usersCol.findOne({ username: username.toLowerCase() });
    if (exists) return NextResponse.json({ error: `Username "${username}" already taken` }, { status: 400 });

    // ✅ Check if class teacher already exists for this class-section
    if (classTeacher && assignedClass && rest.section) {
      const existingClassTeacher = await teachersCol.findOne({
        assignedClass,
        section: rest.section,
        classTeacher: true,
        branch,
      });
      
      if (existingClassTeacher) {
        return NextResponse.json({ 
          error: `${assignedClass}-${rest.section} already has a class teacher: ${existingClassTeacher.name}` 
        }, { status: 400 });
      }
    }

    const employeeId = generateEmployeeId(rest.name);
    const teacherId  = new mongoose.Types.ObjectId();
    const userId     = new mongoose.Types.ObjectId();
    const hashedPwd  = await bcrypt.hash(password, 10);

    // Create teacher with class teacher fields
    await teachersCol.insertOne({
      _id: teacherId, 
      ...rest, 
      branch, 
      branchId, 
      employeeId, 
      username: username.toLowerCase(), 
      userId,
      classTeacher: classTeacher || false,     // ✅ Include class teacher flag
      assignedClass: classTeacher ? (assignedClass || rest.class || '') : '',  // ✅ Include assigned class
      status: rest.status || 'Active', 
      salary: Number(rest.salary) || 0,
      presentDays: 0, 
      absentDays: 0, 
      totalDays: 0,
      createdAt: new Date(), 
      updatedAt: new Date(),
    });

    // Create user account
    await usersCol.insertOne({
      _id: userId, 
      username: username.toLowerCase(), 
      password: hashedPwd, 
      role: 'teacher',
      branch, 
      branchId, 
      teacherId, 
      employeeId,
      name: rest.name, 
      email: rest.email || '',
      isActive: true, 
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      data: { employeeId, username: username.toLowerCase() }, 
      message: `Teacher created successfully${classTeacher ? ' and assigned as class teacher' : ''}` 
    });
  } catch (err) {
    console.error('[POST /api/teachers]', err);
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

    const collection = mongoose.connection.db.collection('teachers');
    const objectId = new mongoose.Types.ObjectId(teacherId);

    // Check if another teacher is already class teacher for this class+section
    const existing = await collection.findOne({
      assignedClass,
      section,
      classTeacher: true,
      _id: { $ne: objectId },
    });

    if (existing) {
      return NextResponse.json(
        { error: `${assignedClass}-${section} already has a class teacher: ${existing.name}` },
        { status: 400 }
      );
    }

    // Update the teacher (reassign)
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { 
        $set: { 
          assignedClass, 
          section, 
          classTeacher: true,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
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

    const collection = mongoose.connection.db.collection('teachers');
    const objectId = new mongoose.Types.ObjectId(teacherId);

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { 
        $set: { 
          classTeacher: false, 
          assignedClass: '', 
          section: '',
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Assignment removed' });
  } catch (err) {
    console.error('[DELETE /api/class-teacher]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}