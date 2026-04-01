import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username and password required' 
      }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ 
        success: false, 
        error: 'Account is disabled. Contact admin.' 
      }, { status: 403 });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Remove password from response
    const { password: _, ...safeUser } = user;

    // ✅ Attach teacher details if applicable
    if ((user.role === 'teacher' || user.role === 'teacher-admin') && user.teacherId) {
      const teacher = await prisma.teacher.findUnique({ 
        where: { id: user.teacherId } 
      });
      
      if (teacher) {
        safeUser.assignedClass = teacher.assignedClass || '';
        safeUser.section       = teacher.section || '';
        safeUser.classTeacher  = teacher.classTeacher || false;
        safeUser.subject       = teacher.subject || '';
        safeUser.employeeId    = teacher.employeeId || '';
      }
    }

    // ✅ Attach student details if applicable
    if (user.role === 'student') {
      let student = null;

      // Strategy 1: Try User.studentId first (most reliable)
      if (user.studentId) {
        try {
          student = await prisma.student.findUnique({
            where: { id: user.studentId }
          });
          if (student) console.log('✅ Found student via User.studentId');
        } catch (e) {
          console.log('⚠️ User.studentId lookup failed');
        }
      }

      // Strategy 2: Try username match
      if (!student && user.username) {
        student = await prisma.student.findFirst({
          where: { 
            username: { 
              equals: user.username, 
              mode: 'insensitive' 
            } 
          }
        });
        if (student) console.log('✅ Found student via username');
      }

      // Strategy 3: Try rollNo + branch match
      if (!student && user.rollNo) {
        student = await prisma.student.findFirst({
          where: { 
            rollNo: { equals: user.rollNo, mode: 'insensitive' },
            ...(user.branch && { branch: user.branch })
          }
        });
        if (student) console.log('✅ Found student via rollNo + branch');
      }

      // If student found, attach data and fix links if needed
      if (student) {
        console.log('✅ Student found for login:', student.name, student.id);

        // Add student data to response
        safeUser.studentId   = student.id;
        safeUser.studentName = student.name;
        safeUser.rollNo      = student.rollNo;
        safeUser.class       = student.class;
        safeUser.section     = student.section;
        safeUser.parentName  = student.parentName;
        safeUser.totalFee    = student.totalFee;
        safeUser.paidFee     = student.paidFee;

        // ✅ Fix missing links (one-time auto-fix)
        let needsUpdate = false;

        // Fix User.studentId if missing
        if (!user.studentId || user.studentId !== student.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { studentId: student.id }
          });
          console.log('✅ Fixed User.studentId link');
          needsUpdate = true;
        }

        // Fix Student.userId if missing
        if (!student.userId || student.userId !== user.id) {
          await prisma.student.update({
            where: { id: student.id },
            data: { 
              userId: user.id,
              username: user.username.toLowerCase()
            }
          });
          console.log('✅ Fixed Student.userId link');
          needsUpdate = true;
        }

        if (needsUpdate) {
          console.log('✅ Auto-fixed missing links for:', user.username);
        }
      } else {
        console.log('⚠️ No student record found for user:', user.username);
        // Still allow login but flag missing student data
        safeUser.studentMissing = true;
      }
    }

    console.log('✅ Login successful:', user.username, user.role);

    return NextResponse.json({ 
      success: true, 
      user: safeUser 
    });

  } catch (err) {
    console.error('[Login Error]', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}