import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { newPassword } = await req.json();

    console.log('[Reset Password] Request:', { id, passwordLength: newPassword?.length });

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Find branch (adminId is a plain String, NOT a relation)
    const branch = await prisma.branch.findUnique({
      where: { id }
    });

    if (!branch) {
      console.log('[Reset Password] ❌ Branch not found');
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    if (!branch.adminId) {
      console.log('[Reset Password] ❌ No admin linked');
      return NextResponse.json({ error: 'No admin linked to this branch' }, { status: 404 });
    }

    console.log('[Reset Password] Branch found:', branch.name, 'Admin ID:', branch.adminId);

    // Find the admin user separately
    const admin = await prisma.user.findUnique({
      where: { id: branch.adminId }
    });

    if (!admin) {
      console.log('[Reset Password] ❌ Admin user not found');
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    console.log('[Reset Password] Admin found:', admin.username);

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: branch.adminId },
      data: { password: hashedPassword }
    });

    console.log('[Reset Password] ✅ Password updated for:', admin.username);

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for @${admin.username}`
    });

  } catch (err) {
    console.error('[Reset Password] ❌ Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}