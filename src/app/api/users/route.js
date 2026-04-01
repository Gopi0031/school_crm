import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role     = searchParams.get('role')     || '';
    const branchId = searchParams.get('branchId') || '';

    const users = await prisma.user.findMany({
      where: {
        ...(role     && { role }),
        ...(branchId && { branchId }),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, username: true, role: true, name: true,
        email: true, phone: true, branch: true, branchId: true,
        employeeId: true, class: true, section: true,
        rollNo: true, isActive: true, createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const existing = await prisma.user.findUnique({
      where: { username: body.username?.toLowerCase() },
    });
    if (existing)
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });

    const hashed = await bcrypt.hash(body.password, 10);
    const { password, ...rest } = body;

    const user = await prisma.user.create({
      data: { ...rest, password: hashed, username: body.username.toLowerCase() },
    });

    const { password: _p, ...safe } = user;
    return NextResponse.json({ success: true, data: safe }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
