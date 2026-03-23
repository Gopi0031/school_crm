import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role     = searchParams.get('role');
    const branchId = searchParams.get('branchId');

    const users = await prisma.user.findMany({
      where: {
        ...(role     && { role }),
        ...(branchId && { branchId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Strip passwords
    const safe = users.map(({ password, ...u }) => u);
    return NextResponse.json({ success: true, data: safe });
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
    if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 400 });

    const hashed = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { ...body, password: hashed, username: body.username.toLowerCase() },
    });

    const { password: _, ...safe } = user;
    return NextResponse.json({ success: true, data: safe }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
