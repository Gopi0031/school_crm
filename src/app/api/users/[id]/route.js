import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { verifyOtp } from '@/lib/otpStore';

export async function GET(req, { params }) {
  try {
    const { id } = await params; // ✅ await params — Next.js 15 fix
    await connectDB();
    const user = await User.findById(id).select('-password');
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params; // ✅ await params — Next.js 15 fix

    if (!id || id === 'undefined') {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    await connectDB();
    const body = await req.json();

    console.log('[PUT /api/users] id:', id, '| fields:', Object.keys(body));

    // ── Password change ──
    if (body.password) {
      // Super-admin requires OTP, others do not
      if (body.otp && body.email) {
        const result = verifyOtp(body.email.toLowerCase().trim(), body.otp);
        if (!result.valid) {
          return NextResponse.json({ success: false, message: result.reason }, { status: 400 });
        }
      }

      const hashed = await bcrypt.hash(body.password, 12);
      await User.findByIdAndUpdate(id, { password: hashed, updatedAt: new Date() });

      // ✅ Verify it saved
      const check    = await User.findById(id).select('password');
      const verified = await bcrypt.compare(body.password, check.password);
      console.log('[PUT /api/users] password save verified:', verified);

      if (!verified) {
        return NextResponse.json({ success: false, message: 'Password save failed' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    // ── Other fields ──
    const { password, otp, ...safeFields } = body;
    const updated = await User.findByIdAndUpdate(
      id,
      { ...safeFields, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!updated) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });

  } catch (err) {
    console.error('[PUT /api/users]', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params; // ✅ await params — Next.js 15 fix
    await connectDB();
    await User.findByIdAndUpdate(id, { isActive: false });
    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
