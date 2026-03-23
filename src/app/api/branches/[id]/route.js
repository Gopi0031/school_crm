import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const branch = await prisma.branch.findUnique({ where: { id } });

    if (!branch) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch admin user separately (adminId is a String, not a relation)
    let admin = null;
    if (branch.adminId) {
      admin = await prisma.user.findUnique({
        where: { id: branch.adminId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          isActive: true
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...branch, adminId: admin }
    });
  } catch (err) {
    console.error('[GET /api/branches/:id]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { branchName, adminName, email, phone, isActive, password } = await req.json();

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Update branch fields
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        ...(branchName !== undefined && { name: branchName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Update linked admin user
    if (branch.adminId) {
      const userUpdates = {};

      if (adminName) userUpdates.name = adminName;
      if (email !== undefined) userUpdates.email = email;
      if (phone !== undefined) userUpdates.phone = phone;
      if (isActive !== undefined) userUpdates.isActive = isActive;

      // If branch name changed, update admin's branch field too
      if (branchName) userUpdates.branch = branchName;

      // If password provided, hash it
      if (password && password.trim().length >= 8) {
        userUpdates.password = await bcrypt.hash(password.trim(), 10);
      }

      if (Object.keys(userUpdates).length > 0) {
        await prisma.user.update({
          where: { id: branch.adminId },
          data: userUpdates,
        });
      }
    }

    // Fetch updated admin info
    let admin = null;
    if (branch.adminId) {
      admin = await prisma.user.findUnique({
        where: { id: branch.adminId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...updatedBranch, adminId: admin }
    });
  } catch (err) {
    console.error('[PUT /api/branches/:id]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const branch = await prisma.branch.findUnique({ where: { id } });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Delete admin user if exists
    if (branch.adminId) {
      try {
        await prisma.user.delete({ where: { id: branch.adminId } });
        console.log('[DELETE] Admin user deleted:', branch.adminId);
      } catch (e) {
        console.warn('[DELETE] Could not delete admin:', e.message);
      }
    }

    // Delete the branch
    await prisma.branch.delete({ where: { id } });
    console.log('[DELETE] Branch deleted:', branch.name);

    return NextResponse.json({
      success: true,
      message: 'Branch permanently deleted'
    });
  } catch (err) {
    console.error('[DELETE /api/branches/:id]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}