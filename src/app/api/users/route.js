import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const branchId = searchParams.get('branchId');
    const query = {};
    if (role) query.role = role;
    if (branchId) query.branchId = branchId;
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const existing = await User.findOne({ username: body.username?.toLowerCase() });
    if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    const hashed = await bcrypt.hash(body.password, 10);
    const user = await User.create({ ...body, password: hashed, username: body.username.toLowerCase() });
    const { password: _, ...safe } = user.toObject();
    return NextResponse.json({ success: true, data: safe }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
