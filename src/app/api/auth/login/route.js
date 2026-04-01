import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user)         return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    if (!user.isActive) return NextResponse.json({ success: false, error: 'Account is disabled' }, { status: 403 });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });

    const { password: _, ...safeUser } = user;

    // Attach teacher details if applicable
    if ((user.role === 'teacher' || user.role === 'teacher-admin') && user.teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: user.teacherId } });
      if (teacher) {
        safeUser.assignedClass = teacher.assignedClass || '';
        safeUser.section       = teacher.section || '';
        safeUser.classTeacher  = teacher.classTeacher || false;
        safeUser.subject       = teacher.subject || '';
        safeUser.employeeId    = teacher.employeeId || '';
      }
    }

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('[Login Error]', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
