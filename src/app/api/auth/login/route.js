// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const redirectMap = {
  'super-admin':   '/super-admin/dashboard',
  'branch-admin':  '/branch-admin/dashboard',
  'teacher-admin': '/teacher-admin/dashboard',
    'teacher':       '/teacher-admin/dashboard',  // ✅ fallback for old data
  'student':       '/student/dashboard',
};

export async function POST(req) {
  try {
    await connectDB();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const usersCol = mongoose.connection.db.collection('users');

    const user = await usersCol.findOne({
      username: { $regex: `^${username.trim()}$`, $options: 'i' },
    });

    console.log('[login] username attempted:', username);
    console.log('[login] user found:', user ? `yes — role: ${user.role}` : 'NO');

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ error: 'Account is deactivated. Contact admin.' }, { status: 403 });
    }

    const match = await bcrypt.compare(password.trim(), user.password);
    console.log('[login] password match:', match);

    if (!match) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const safeUser = {
      _id:       user._id.toString(),
      username:  user.username,
      name:      user.name      || '',
      role:      user.role,
      branch:    user.branch    || '',
      branchId:  user.branchId?.toString()  || '',
      email:     user.email     || '',
      phone:     user.phone     || '',
      rollNo:    user.rollNo    || '',
      class:     user.class     || '',
      section:   user.section   || '',
studentId: user.studentId ? user.studentId.toString() : '',
      teacherId: user.teacherId?.toString() || '',
      redirect:  redirectMap[user.role] || '/login',  // ✅ ADD THIS
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('[login error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
