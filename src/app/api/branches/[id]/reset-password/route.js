import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/mailer';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8)
      return NextResponse.json({ error: 'Min 8 characters required' }, { status: 400 });

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    if (!branch.adminId) return NextResponse.json({ error: 'No admin linked to this branch' }, { status: 404 });

    const admin = await prisma.user.findUnique({ where: { id: branch.adminId } });
    if (!admin) return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: branch.adminId }, data: { password: hashed } });

    let emailSent = false;
    if (admin.email) {
      try {
        await sendEmail({
          to:      admin.email,
          subject: 'Your SchoolERP Password Has Been Reset',
          html: `
            <p>Hello <b>${admin.name}</b>,</p>
            <p>Your password has been reset by the Super Admin.</p>
            <p><b>Username:</b> ${admin.username}</p>
            <p><b>New Password:</b> ${newPassword}</p>
            <p>Please change your password after logging in.</p>
          `,
        });
        emailSent = true;
      } catch (e) {
        console.warn('Email failed:', e.message);
      }
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (err) {
    console.error('[reset-password]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
