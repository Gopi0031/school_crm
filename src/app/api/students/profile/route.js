// src/app/api/students/profile/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const studentId = searchParams.get('studentId');
    const username = searchParams.get('username');
    const rollNo = searchParams.get('rollNo');

    console.log('Profile lookup params:', { userId, studentId, username, rollNo });

    let student = null;

    // Strategy 1: direct student record ID
    if (studentId) {
      student = await prisma.student.findFirst({ where: { id: studentId } });
      console.log('Found by studentId:', !!student);
    }

    // Strategy 2: username stored on student (most reliable)
    if (!student && username) {
      student = await prisma.student.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } }
      });
      console.log('Found by username:', !!student);
    }

    // Strategy 3: userId field on student
    if (!student && userId) {
      student = await prisma.student.findFirst({
        where: { userId: userId }
      });
      console.log('Found by userId:', !!student);
    }

    // Strategy 4: rollNo fallback
    if (!student && rollNo) {
      student = await prisma.student.findFirst({
        where: { rollNo: { equals: rollNo, mode: 'insensitive' } }
      });
      console.log('Found by rollNo:', !!student);
    }

    if (!student) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Student not found', 
          debug: { userId, studentId, username, rollNo } 
        },
        { status: 404 }
      );
    }

    // Always recompute fee — never trust stored paidFee
    const total = Number(student.totalFee) || 0;
    const t1 = Number(student.term1) || 0;
    const t2 = Number(student.term2) || 0;
    const t3 = Number(student.term3) || 0;
    const paid = t1 + t2 + t3;

    let term1Due = 0, term2Due = 0, term3Due = 0;
    if (total > 0) {
      const base = Math.floor(total / 3);
      const extra = total - base * 3;
      term1Due = Math.max(0, (base + extra) - t1);
      term2Due = Math.max(0, base - t2);
      term3Due = Math.max(0, base - t3);
    }

    const responseData = {
      ...student,
      totalFee: total,
      paidFee: paid,
      term1: t1,
      term2: t2,
      term3: t3,
      term1Due,
      term2Due,
      term3Due,
    };

    console.log('Returning student fee data:', {
      id: student.id,
      name: student.name,
      totalFee: total,
      paidFee: paid,
      term1: t1, term2: t2, term3: t3,
      term1Due, term2Due, term3Due,
    });

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error('GET /api/students/profile error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}