import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Manually fetch admin for each branch
    // (adminId is a String field, not a Prisma relation)
    const result = await Promise.all(
      branches.map(async (branch) => {
        let admin = null;

        if (branch.adminId) {
          try {
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
                branch: true,
                branchId: true,
              },
            });
          } catch (e) {
            console.warn('Could not fetch admin for branch:', branch.name, e.message);
          }
        }

        return {
          ...branch,
          adminId: admin, // Replace the string ID with the full admin object
        };
      })
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('GET branches error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { branchName, adminName, username, email, phone, password } = await req.json();

    if (!branchName || !adminName || !username || !password) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Check if username already taken
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        password: hashed,
        name: adminName,
        email: email || '',
        phone: phone || '',
        role: 'branch-admin',
        branch: branchName,
        isActive: true,
      },
    });

    console.log('[POST] Created admin user:', adminUser.username, adminUser.id);

    // Create branch with adminId as string
    const branch = await prisma.branch.create({
      data: {
        name: branchName,
        email: email || '',
        phone: phone || '',
        adminId: adminUser.id, // This is stored as a String
        isActive: true,
      },
    });

    console.log('[POST] Created branch:', branch.name, branch.id);

    // Link branchId back to admin user
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        branchId: branch.id,
        branch: branchName,
      },
    });

    // Return branch with admin info (without password)
    const { password: _, ...safeAdmin } = adminUser;

    return NextResponse.json(
      {
        success: true,
        data: { ...branch, adminId: safeAdmin },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST branch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}