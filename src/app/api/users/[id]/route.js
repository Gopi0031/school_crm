import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyOtp } from '@/lib/otpStore';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { password: _, ...safe } = user;
    return NextResponse.json({ success: true, data: safe });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    if (!id || id === 'undefined')
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });

    const body = await req.json();
    console.log('[PUT /api/users] id:', id, '| fields:', Object.keys(body));

    // ── Password change ──
    if (body.password) {
      if (body.otp && body.email) {
        const result = verifyOtp(body.email.toLowerCase().trim(), body.otp);
        if (!result.valid)
          return NextResponse.json({ success: false, message: result.reason }, { status: 400 });
      }

      const hashed = await bcrypt.hash(body.password, 12);
      await prisma.user.update({ where: { id }, data: { password: hashed } });

      // Verify it saved
      const check = await prisma.user.findUnique({ where: { id } });
      const verified = await bcrypt.compare(body.password, check.password);
      console.log('[PUT /api/users] password save verified:', verified);

      if (!verified)
        return NextResponse.json({ success: false, message: 'Password save failed' }, { status: 500 });

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    // ── Other fields ──
    const { password, otp, ...safeFields } = body;
    const updated = await prisma.user.update({
      where: { id },
      data:  safeFields,
    });
    if (!updated)
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const { password: _, ...safe } = updated;
    return NextResponse.json({ success: true, data: safe });
  } catch (err) {
    console.error('[PUT /api/users]', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
