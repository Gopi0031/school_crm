import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Login] Attempt:', {
      username,
      passwordLength: password?.length,
    });

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password required'
      }, { status: 400 });
    }

    const trimmedUsername = username.toLowerCase().trim();

    // ✅ Find user using PRISMA (same as branch creation)
    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername }
    });

    console.log('[Login] User lookup:', user ? {
      found: true,
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      branch: user.branch,
    } : {
      found: false,
      searchedFor: trimmedUsername
    });

    if (!user) {
      console.log('[Login] ❌ User not found');
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    if (!user.isActive) {
      console.log('[Login] ❌ Account disabled');
      return NextResponse.json({
        success: false,
        error: 'Account is disabled'
      }, { status: 403 });
    }

    // Compare password
    console.log('[Login] Comparing passwords...');
    const match = await bcrypt.compare(password, user.password);
    console.log('[Login] Password match:', match);

    if (!match) {
      console.log('[Login] ❌ Invalid password');
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Build response (exclude password)
    const { password: _, ...safeUser } = user;

    // ✅ If teacher, fetch teacher details
    if (user.role === 'teacher' || user.role === 'teacher-admin') {
      try {
        // Try finding teacher by userId
        let teacher = await prisma.teacher.findFirst({
          where: { userId: user.id }
        });

        // Fallback: try by name + branch
        if (!teacher) {
          teacher = await prisma.teacher.findFirst({
            where: {
              name: user.name,
              branch: user.branch
            }
          });
        }

        if (teacher) {
          safeUser.teacherId = teacher.id;
          safeUser.assignedClass = teacher.assignedClass || teacher.class || '';
          safeUser.section = teacher.section || '';
          safeUser.classTeacher = teacher.classTeacher || false;
          safeUser.subject = teacher.subject || '';
          safeUser.employeeId = teacher.employeeId || '';

          console.log('[Login] ✅ Teacher details:', {
            assignedClass: safeUser.assignedClass,
            section: safeUser.section,
            classTeacher: safeUser.classTeacher,
            subject: safeUser.subject,
          });
        }
      } catch (teacherErr) {
        console.warn('[Login] Could not fetch teacher details:', teacherErr.message);
      }
    }

    // ✅ If student, fetch student details
    if (user.role === 'student') {
      try {
        let student = await prisma.student.findFirst({
          where: { userId: user.id }
        });

        if (!student && user.studentId) {
          student = await prisma.student.findUnique({
            where: { id: user.studentId }
          });
        }

        if (student) {
          safeUser.studentId = student.id;
          safeUser.class = student.class || safeUser.class;
          safeUser.section = student.section || safeUser.section;
          safeUser.rollNo = student.rollNo || safeUser.rollNo;

          console.log('[Login] ✅ Student details:', {
            class: safeUser.class,
            section: safeUser.section,
            rollNo: safeUser.rollNo,
          });
        }
      } catch (studentErr) {
        console.warn('[Login] Could not fetch student details:', studentErr.message);
      }
    }

    console.log('[Login] ✅ Success:', safeUser.username, '→', safeUser.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json({ success: true, user: safeUser });

  } catch (err) {
    console.error('[Login] ❌ Error:', err);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}