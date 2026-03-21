import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branch      = searchParams.get('branch');
    const cls         = searchParams.get('class');
    const section     = searchParams.get('section');
    const status      = searchParams.get('status');
    const search      = searchParams.get('search');
    const academicYear = searchParams.get('academicYear');
    const branchId    = searchParams.get('branchId');

    const query = {};
    if (branch)      query.branch      = branch;
    // ✅ Replace strict match with regex match for class
if (cls) query.class = { $regex: new RegExp(`^${cls}$`, 'i') };
if (section) query.section = { $regex: new RegExp(`^${section}$`, 'i') };

    if (status)      query.status      = status;
    if (academicYear) query.academicYear = academicYear;
    if (branchId)    query.branchId    = branchId;
    if (search) {
      query.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { rollNo:     { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { phone:      { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query).sort({ rollNo: 1 });
    return NextResponse.json({ success: true, data: students });
  } catch (err) {
    console.error('GET students error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name, rollNo, class: cls, section, gender, bloodGroup, caste,
      aadhaar, address, parentName, phone, email, branch, branchId,
      academicYear, yearOfJoining, dateOfJoining, totalFee,
      username, password,
    } = body;

    if (!name || !rollNo || !cls || !section) {
      return NextResponse.json({ error: 'Name, Roll No, Class and Section are required' }, { status: 400 });
    }

    const existing = await Student.findOne({ rollNo, branch });
    if (existing) return NextResponse.json({ error: 'Roll number already exists' }, { status: 400 });

    let userId = null;
    // Create student login if credentials provided
    if (username && password) {
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });

      const hashed = await bcrypt.hash(password, 10);
      const userRecord = await User.create({
        username: username.toLowerCase(),
        password: hashed,
        role: 'student',
        name,
        email,
        phone,
        branch,
        branchId,
        class:   cls,
        section,
        rollNo,
        isActive: true,
      });
      userId = userRecord._id;
    }

    const student = await Student.create({
      name, rollNo, class: cls, section, gender, bloodGroup, caste,
      aadhaar, address, parentName, phone, email, branch, branchId,
      academicYear: academicYear || '2024-25',
      yearOfJoining, dateOfJoining,
      totalFee: Number(totalFee) || 0,
      userId,
      status: 'Active',
    });

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (err) {
    console.error('POST student error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
