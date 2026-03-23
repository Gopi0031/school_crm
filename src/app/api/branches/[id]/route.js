import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let admin = null;
    if (branch.adminId) {
      admin = await prisma.user.findUnique({
        where:  { id: branch.adminId },
        select: { id:true, name:true, username:true, email:true, phone:true, role:true, isActive:true },
      });
    }
    return NextResponse.json({ success: true, data: { ...branch, adminId: admin } });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { branchName, adminName, email, phone, isActive, password } = await req.json();

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    // Update branch
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        ...(branchName             && { name: branchName }),
        ...(email    !== undefined && { email }),
        ...(phone    !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Update linked admin user
    if (branch.adminId) {
      const userUpdates = {
        ...(adminName              && { name: adminName }),
        ...(email    !== undefined && { email }),
        ...(phone    !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      };
      if (password && password.trim().length >= 8)
        userUpdates.password = await bcrypt.hash(password.trim(), 10);

      if (Object.keys(userUpdates).length > 0)
        await prisma.user.update({ where: { id: branch.adminId }, data: userUpdates });
    }

    const admin = branch.adminId
      ? await prisma.user.findUnique({
          where:  { id: branch.adminId },
          select: { id:true, name:true, username:true, email:true, phone:true, role:true, isActive:true },
        })
      : null;

    return NextResponse.json({ success: true, data: { ...updatedBranch, adminId: admin } });
  } catch (err) {
    console.error('[PUT /api/branches/:id]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    if (branch.adminId)
      await prisma.user.delete({ where: { id: branch.adminId } });

    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Branch permanently deleted' });
  } catch (err) {
    console.error('[DELETE /api/branches/:id]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
