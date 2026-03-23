import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Attach admin user to each branch (replaces .populate)
    const result = await Promise.all(branches.map(async (b) => {
      if (!b.adminId) return { ...b, adminId: null };
      const admin = await prisma.user.findUnique({
        where: { id: b.adminId },
        select: { id:true, name:true, username:true, email:true, phone:true, role:true, isActive:true, branch:true, branchId:true },
      });
      return { ...b, adminId: admin };
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('GET branches error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { branchName, adminName, username, email, phone, password } = await req.json();

    if (!branchName || !adminName || !username || !password)
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });

    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });
    if (existing)
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        password: hashed,
        name:     adminName,
        email:    email || '',
        phone:    phone || '',
        role:     'branch-admin',
        isActive: true,
      },
    });

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        name:     branchName,
        email:    email || '',
        phone:    phone || '',
        adminId:  adminUser.id,
        isActive: true,
      },
    });

    // Link branchId back to user
    await prisma.user.update({
      where: { id: adminUser.id },
      data:  { branchId: branch.id, branch: branchName },
    });

    const { password: _, ...safeAdmin } = adminUser;
    return NextResponse.json({ success: true, data: { ...branch, adminId: safeAdmin } }, { status: 201 });
  } catch (err) {
    console.error('POST branch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
