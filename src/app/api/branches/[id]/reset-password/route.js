import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Branch from '@/models/Branch';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/mailer';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id }          = await params;
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Min 8 characters required' }, { status: 400 });
    }

    const branch = await Branch.findById(id).populate('adminId');
    if (!branch)         return NextResponse.json({ error: 'Branch not found' },             { status: 404 });
    if (!branch.adminId) return NextResponse.json({ error: 'No admin linked to this branch' }, { status: 404 });

    // ── 1. Hash and save new password ─────────────────────
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(branch.adminId._id, { password: hashed });

    // ── 2. Send email — non-fatal if it fails ─────────────
    let emailSent = false;
    if (branch.adminId?.email) {
      try {
        await sendEmail({
          to:      branch.adminId.email,
          subject: 'Your SchoolERP Password Has Been Reset',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
              <h2 style="color:#4f46e5;">Password Reset</h2>
              <p>Hello <strong>${branch.adminId.name}</strong>,</p>
              <p>Your SchoolERP login password has been reset by the Super Admin.</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
                <p style="margin:0;font-size:0.9rem;color:#64748b;">Username</p>
                <p style="margin:4px 0 12px;font-weight:700;">${branch.adminId.username}</p>
                <p style="margin:0;font-size:0.9rem;color:#64748b;">New Password</p>
                <p style="margin:4px 0 0;font-weight:700;font-family:monospace;">${newPassword}</p>
              </div>
              <p style="color:#64748b;font-size:0.85rem;">Please change your password after logging in.</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailErr) {
        console.warn('[reset-password] Email failed (non-fatal):', emailErr.message);
      }
    }

    return NextResponse.json({
      success:   true,
      message:   emailSent
        ? 'Password reset successfully. Login details sent via email.'
        : 'Password reset successfully.',
      emailSent,
    });

  } catch (err) {
    console.error('[reset-password]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
