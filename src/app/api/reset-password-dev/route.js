import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// ⚠️ DELETE THIS FILE after use — dev only!
export async function GET(req) {
  try {
    await connectDB();

    const newPassword = 'Admin@1234'; // set whatever you want
    const hashed = await bcrypt.hash(newPassword, 12);

    const result = await User.findOneAndUpdate(
      { username: 'superadmin' },
      { password: hashed },
      { new: true }
    );

    if (!result) return NextResponse.json({ success: false, message: 'User not found' });

    return NextResponse.json({
      success: true,
      message: `Password reset to: ${newPassword}`,
      user: result.username,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
