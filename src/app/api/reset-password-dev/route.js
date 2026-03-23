import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// ⚠️ DELETE THIS FILE after use — dev only!
export async function GET() {
  try {
    const newPassword = 'Admin@1234';
    const hashed = await bcrypt.hash(newPassword, 12);

    const result = await prisma.user.update({
      where: { username: 'superadmin' },
      data:  { password: hashed },
    });

    return NextResponse.json({ success: true, message: `Password reset to: ${newPassword}`, user: result.username });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
