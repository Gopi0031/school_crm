import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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

    const db         = mongoose.connection.db;
    const collection = db.collection('teachers');

    // ✅ Only add branch filter when a branch is actually provided
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
    const body     = await request.json();
    const db       = mongoose.connection.db;
    const teachers = db.collection('teachers');
    const users    = db.collection('users');

    const { username, password, confirmPassword, branch, branchId, ...rest } = body;

    if (!rest.name) return NextResponse.json({ error: 'Name is required' },     { status: 400 });
    if (!username)  return NextResponse.json({ error: 'Username is required' },  { status: 400 });
    if (!password)  return NextResponse.json({ error: 'Password is required' },  { status: 400 });

    const exists = await users.findOne({ username });
    if (exists) return NextResponse.json({ error: `Username "${username}" already taken` }, { status: 400 });

    const employeeId = generateEmployeeId(rest.name);
    const teacherId  = new mongoose.Types.ObjectId();
    const userId     = new mongoose.Types.ObjectId();
    const hashedPwd  = await bcrypt.hash(password, 10);

    await teachers.insertOne({
      _id: teacherId,
      ...rest,
      branch, branchId,
      employeeId, username,
      userId,
      status:      rest.status || 'Active',
      salary:      Number(rest.salary) || 0,
      presentDays: 0, absentDays: 0, totalDays: 0,
      createdAt:   new Date(), updatedAt: new Date(),
    });

    await users.insertOne({
      _id: userId,
      username,
      password:   hashedPwd,
      role:       'teacher',
      branch, branchId,
      teacherId,
      employeeId,
      name:       rest.name,
      email:      rest.email || '',
      createdAt:  new Date(),
    });

    return NextResponse.json({
      success: true,
      data:    { employeeId, username },
      message: 'Teacher created successfully',
    });
  } catch (err) {
    console.error('[POST /api/teachers]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
