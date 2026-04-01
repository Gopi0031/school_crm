import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyOtp } from '@/lib/otpStore';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, role: true, name: true,
        email: true, phone: true, branch: true, branchId: true,
        employeeId: true, class: true, section: true,
        rollNo: true, isActive: true, createdAt: true,
      },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Password change
    if (body.password) {
      // Super-admin requires OTP
      if (body.otp && body.email) {
        const result = verifyOtp(body.email.toLowerCase().trim(), body.otp);
        if (!result.valid)
          return NextResponse.json({ success: false, message: result.reason }, { status: 400 });
      }
      const hashed = await bcrypt.hash(body.password, 12);
      await prisma.user.update({ where: { id }, data: { password: hashed } });

      // Verify it saved
      const check    = await prisma.user.findUnique({ where: { id } });
      const verified = await bcrypt.compare(body.password, check.password);
      if (!verified)
        return NextResponse.json({ success: false, message: 'Password save failed' }, { status: 500 });

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    // Other fields
    const { password, otp, id: _id, createdAt, ...safeFields } = body;
    const updated = await prisma.user.update({
      where: { id },
      data:  safeFields,
      select: {
        id: true, username: true, role: true, name: true,
        email: true, phone: true, branch: true, isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PUT /api/users/[id]]', err.message);
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
