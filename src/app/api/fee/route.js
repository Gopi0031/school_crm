import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch   = searchParams.get('branch');
    const cls      = searchParams.get('class');
    const section  = searchParams.get('section');
    const branchId = searchParams.get('branchId');

    const students = await prisma.student.findMany({
      where: {
        ...(branch   && { branch }),
        ...(branchId && { branchId }),
        ...(cls      && { class: cls }),
        ...(section  && { section }),
      },
      select: {
        id: true, name: true, rollNo: true, class: true, section: true,
        branch: true, totalFee: true, paidFee: true,
        phone: true, parentName: true, status: true,
      },
    });

    const summary = {
      totalFee:   students.reduce((a, s) => a + (s.totalFee || 0), 0),
      paidFee:    students.reduce((a, s) => a + (s.paidFee  || 0), 0),
      pendingFee: students.reduce((a, s) => a + ((s.totalFee || 0) - (s.paidFee || 0)), 0),
    };
    return NextResponse.json({ success: true, data: students, summary });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { studentId, term1, term2, term3 } = await req.json();

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const t1 = term1 !== undefined ? Number(term1) : (student.term1 || 0);
    const t2 = term2 !== undefined ? Number(term2) : (student.term2 || 0);
    const t3 = term3 !== undefined ? Number(term3) : (student.term3 || 0);
    const paidFee = t1 + t2 + t3;

    const updated = await prisma.student.update({
      where: { id: studentId },
      data:  { term1: t1, term2: t2, term3: t3, paidFee },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
