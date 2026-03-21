import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Branch from '@/models/Branch';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();
    const branches = await Branch.find()
      .populate('adminId', '-password')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: branches });
  } catch (err) {
    console.error('GET branches error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { branchName, adminName, username, email, phone, password } = await req.json();

    if (!branchName || !adminName || !username || !password) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Check username already exists
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Create admin user
    const hashed = await bcrypt.hash(password, 10);
    const adminUser = await User.create({
      username: username.toLowerCase().trim(),
      password: hashed,
      name:     adminName,
      email:    email || '',
      phone:    phone || '',
      role:     'branch-admin',
      isActive: true,
    });

    // Create branch linked to admin
    const branch = await Branch.create({
      name:     branchName,
      email:    email || '',
      phone:    phone || '',
      adminId:  adminUser._id,
      isActive: true,
    });

    // Link branchId back to user
    await User.findByIdAndUpdate(adminUser._id, {
      branchId: String(branch._id),
      branch:   branchName,
    });

    const populated = await Branch.findById(branch._id).populate('adminId', '-password');
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (err) {
    console.error('POST branch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
