import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId    = searchParams.get('userId');
    const studentId = searchParams.get('studentId');
    const username  = searchParams.get('username');
    const rollNo    = searchParams.get('rollNo');
    const branch    = searchParams.get('branch');

    console.log('🔍 Profile API called with:', { userId, studentId, username, rollNo, branch });

    let student = null;

    // Strategy 1: Direct studentId
    if (!student && studentId) {
      try {
        student = await prisma.student.findUnique({ 
          where: { id: studentId } 
        });
        if (student) console.log('✅ Found by studentId:', student.name);
      } catch (e) {
        console.log('⚠️ studentId lookup failed:', e.message);
      }
    }

    // Strategy 2: Username (case-insensitive)
    if (!student && username) {
      student = await prisma.student.findFirst({
        where: { 
          username: { 
            equals: username.toLowerCase().trim(), 
            mode: 'insensitive' 
          } 
        }
      });
      if (student) console.log('✅ Found by username:', student.name);
    }

    // Strategy 3: userId stored on student
    if (!student && userId) {
      student = await prisma.student.findFirst({
        where: { userId: userId }
      });
      if (student) console.log('✅ Found by student.userId:', student.name);
    }

    // Strategy 4: Find User, then Student
    if (!student && userId) {
      try {
        const user = await prisma.user.findUnique({ 
          where: { id: userId } 
        });
        
        if (user) {
          console.log('📦 Found user:', user.username, 'studentId:', user.studentId);
          
          // Via User.studentId
          if (!student && user.studentId) {
            try {
              student = await prisma.student.findUnique({
                where: { id: user.studentId }
              });
              if (student) console.log('✅ Found via User.studentId');
            } catch (e) {}
          }
          
          // Via User.username
          if (!student && user.username) {
            student = await prisma.student.findFirst({
              where: { username: { equals: user.username, mode: 'insensitive' } }
            });
            if (student) console.log('✅ Found via User.username');
          }
          
          // Via User.rollNo
          if (!student && user.rollNo) {
            student = await prisma.student.findFirst({
              where: { 
                rollNo: { equals: user.rollNo, mode: 'insensitive' },
                ...(user.branch && { branch: user.branch })
              }
            });
            if (student) console.log('✅ Found via User.rollNo');
          }
        }
      } catch (e) {
        console.log('⚠️ User lookup failed:', e.message);
      }
    }

    // Strategy 5: RollNo + Branch
    if (!student && rollNo) {
      student = await prisma.student.findFirst({
        where: { 
          rollNo: { equals: rollNo, mode: 'insensitive' },
          ...(branch && { branch })
        }
      });
      if (student) console.log('✅ Found by rollNo + branch:', student.name);
    }

    // Not found
    if (!student) {
      console.log('❌ Student not found with any strategy');
      return NextResponse.json({
        success: false,
        error: 'Student profile not found. Please contact your branch admin.',
        debug: { userId, studentId, username, rollNo, branch }
      }, { status: 404 });
    }

    // Compute fee values
    const total = Number(student.totalFee) || 0;
    const t1    = Number(student.term1)    || 0;
    const t2    = Number(student.term2)    || 0;
    const t3    = Number(student.term3)    || 0;
    const paid  = t1 + t2 + t3;

    // Compute term dues
    let term1Due = Number(student.term1Due) || 0;
    let term2Due = Number(student.term2Due) || 0;
    let term3Due = Number(student.term3Due) || 0;

    // Recompute if all dues are zero but there's fee
    if (total > 0 && term1Due === 0 && term2Due === 0 && term3Due === 0) {
      const base  = Math.floor(total / 3);
      const extra = total - base * 3;
      term1Due = Math.max(0, (base + extra) - t1);
      term2Due = Math.max(0, base - t2);
      term3Due = Math.max(0, base - t3);
    }

    console.log('✅ Returning student:', student.name, {
      id: student.id,
      total, paid, t1, t2, t3,
      term1Due, term2Due, term3Due
    });

    return NextResponse.json({
      success: true,
      data: {
        ...student,
        totalFee: total,
        paidFee: paid,
        term1: t1,
        term2: t2,
        term3: t3,
        term1Due,
        term2Due,
        term3Due,
      },
    });
  } catch (err) {
    console.error('❌ Profile API error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Server error' 
    }, { status: 500 });
  }
}