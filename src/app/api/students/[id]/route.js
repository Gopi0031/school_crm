import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({ 
      where: { id }
      // ✅ Removed include - username is on student model
    });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: student });
  } catch (err) {
    console.error('GET student error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      password, confirmPassword,
      branch, branchId,
      userId, createdAt, updatedAt,
      username,
      ...studentFields
    } = body;

    // Get existing student first
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // ── Validate username uniqueness if changing ──
    if (username?.trim()) {
      const normalized = username.toLowerCase().trim();
      
      if (normalized !== existing.username) {
        const conflict = await prisma.user.findFirst({
          where: { 
            username: normalized, 
            NOT: { id: existing.userId || '__none__' } 
          },
        });
        if (conflict) {
          return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }
      }
    }

    // ── Update Student record ──
    const student = await prisma.student.update({
      where: { id },
      data: {
        ...studentFields,
        totalFee: studentFields.totalFee ? Number(studentFields.totalFee) : undefined,
        ...(username && { username: username.toLowerCase().trim() }),
      },
    });

    // ── Build User update payload ──
    const userUpdate = {
      name:    studentFields.name    || '',
      email:   studentFields.email   || '',
      phone:   studentFields.phone   || '',
      class:   studentFields.class   || '',
      section: studentFields.section || '',
      rollNo:  studentFields.rollNo  || '',
    };

    // Add username if changed
    if (username?.trim()) {
      userUpdate.username = username.toLowerCase().trim();
    }

    // Add password if provided
    if (password?.trim() && password.length >= 6) {
      userUpdate.password = await bcrypt.hash(password.trim(), 10);
    }

    // ── Find and update/create linked User ──
    let linkedUserId = student.userId;

    if (!linkedUserId) {
      // Try to find user by rollNo
      const existingUser = await prisma.user.findFirst({
        where: { rollNo: student.rollNo, role: 'student' },
      });
      linkedUserId = existingUser?.id;
    }

    if (linkedUserId) {
      // Update existing user
      await prisma.user.update({ 
        where: { id: linkedUserId }, 
        data: userUpdate 
      }).catch(err => console.warn('[user update error]', err.message));
      
      // Ensure student.userId is set
      if (!student.userId) {
        await prisma.student.update({ 
          where: { id }, 
          data: { userId: linkedUserId } 
        });
      }
    } else if (username && password) {
      // Create new user if username and password provided
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          username: username.toLowerCase().trim(),
          password: hashedPassword,
          role: 'student',
          name: studentFields.name || '',
          email: studentFields.email || '',
          phone: studentFields.phone || '',
          branch: student.branch,
          branchId: student.branchId,
          rollNo: student.rollNo,
          class: studentFields.class || '',
          section: studentFields.section || '',
          isActive: true,
        },
      });
      
      await prisma.student.update({
        where: { id },
        data: { userId: newUser.id, username: newUser.username }
      });
    }

    return NextResponse.json({ success: true, data: student });
  } catch (err) {
    console.error('PUT student error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const linkedUserId = student.userId || (await prisma.user.findFirst({
      where: { rollNo: student.rollNo, role: 'student' },
    }))?.id;

    if (linkedUserId) {
      await prisma.user.update({ 
        where: { id: linkedUserId }, 
        data: { isActive: false } 
      }).catch(() => {});
    }

    await prisma.student.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    console.error('DELETE student error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}