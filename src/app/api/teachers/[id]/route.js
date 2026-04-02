import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req, { params }) {
  try {
   const { id } = await params;  // ✅ await
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: teacher });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
   const { id } = await params;  // ✅ await
    const body = await req.json();
    const {
      password, confirmPassword,   // ✅ strip
      _usernameTouched,            // ✅ strip — frontend only flag
      username, classTeacher, assignedClass,
      branch, branchId,
      userId, createdAt, updatedAt,
      ...updateFields
    } = body;

    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    // Class teacher conflict check
    if (classTeacher && assignedClass && updateFields.section) {
      const conflict = await prisma.teacher.findFirst({
        where: {
          assignedClass,
          section:      updateFields.section,
          classTeacher: true,
          id:           { not: id },
          branch:       existing.branch,
        },
      });
      if (conflict) return NextResponse.json({
        error: `${assignedClass}-${updateFields.section} already has a class teacher: ${conflict.name}`
      }, { status: 400 });
    }

    const normalizedUsername  = username ? username.toLowerCase().trim() : existing.username;
    const usernameChanged     = normalizedUsername !== existing.username?.toLowerCase();

    if (usernameChanged) {
      const taken = await prisma.user.findFirst({
        where: { username: normalizedUsername, id: { not: existing.userId ?? '' } },
      });
      if (taken) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // ✅ Also strip salary string → number to avoid type mismatch
    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        ...updateFields,
        salary:        Number(updateFields.salary) || 0,
        classTeacher:  classTeacher || false,
        assignedClass: classTeacher ? (assignedClass || '') : '',
        ...(usernameChanged && { username: normalizedUsername }),
      },
    });

    // Update linked user
    if (existing.userId) {
      const userUpdate = {
        name:  updateFields.name  || existing.name,
        email: updateFields.email || existing.email || '',
        phone: updateFields.phone || existing.phone || '',
        ...(usernameChanged && { username: normalizedUsername }),
      };
      if (password && password.trim().length >= 6) {
        userUpdate.password = await bcrypt.hash(password.trim(), 10);
      }
      await prisma.user.update({ where: { id: existing.userId }, data: userUpdate });
    } else if (username && password) {
      const hashedPwd = await bcrypt.hash(password, 10);
      const newUser   = await prisma.user.create({
        data: {
          username:  normalizedUsername,
          password:  hashedPwd,
          role:      'teacher',
          name:      teacher.name,
          email:     teacher.email || '',
          branch:    teacher.branch || '',
          teacherId: teacher.id,
          isActive:  true,
        },
      });
      await prisma.teacher.update({ where: { id }, data: { userId: newUser.id } });
    }

    return NextResponse.json({ success: true, data: teacher, message: 'Teacher updated' });
  } catch (err) {
    console.error('[PUT /api/teachers/[id]]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;  // ✅ await params
    
    console.log('🗑️ DELETE /api/teachers/' + id);
    
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    // Deactivate user
    if (teacher.userId && teacher.userId.length === 24) {
      try {
        await prisma.user.update({ 
          where: { id: teacher.userId }, 
          data: { isActive: false } 
        });
      } catch (e) {
        console.warn('User deactivation failed:', e.message);
      }
    }
    
    await prisma.teacher.delete({ where: { id } });
    console.log('✅ Teacher deleted:', id);

    return NextResponse.json({ success: true, message: 'Teacher deleted' });
  } catch (err) {
    console.error('❌ DELETE teacher error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
