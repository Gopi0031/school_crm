import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Branch from '@/models/Branch';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const branch = await Branch.findById(id).populate('adminId', '-password');
    if (!branch) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: branch });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id }   = await params;
    const body     = await req.json();
    const { branchName, adminName, email, phone, isActive, password } = body;

    const branch = await Branch.findById(id);
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    // ── Update branch fields ───────────────────────────────
    if (branchName)              branch.name     = branchName;
    if (email !== undefined)     branch.email    = email;
    if (phone !== undefined)     branch.phone    = phone;
    if (isActive !== undefined)  branch.isActive = isActive;
    await branch.save();

    // ── Update linked user ─────────────────────────────────
    if (branch.adminId) {
      const updates = {};
      if (adminName)             updates.name     = adminName;
      if (email !== undefined)   updates.email    = email;
      if (phone !== undefined)   updates.phone    = phone;
      if (isActive !== undefined) updates.isActive = isActive;

      // ── Hash and update password if provided ───────────
      if (password && password.trim().length >= 8) {
        updates.password = await bcrypt.hash(password.trim(), 10);
      }

      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(branch.adminId, updates);
      }
    }

    const updated = await Branch.findById(id).populate('adminId', '-password');
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PUT /api/branches/:id]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const branch = await Branch.findById(id);
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    if (branch.adminId) await User.findByIdAndDelete(branch.adminId);
    await Branch.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Branch permanently deleted' });
  } catch (err) {
    console.error('[DELETE /api/branches/:id]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
