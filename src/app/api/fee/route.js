import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper: split totalFee into 3 term dues
function splitTermDues(totalFee) {
  const total = Number(totalFee) || 0;
  if (total === 0) return { term1Due: 0, term2Due: 0, term3Due: 0 };
  const base  = Math.floor(total / 3);
  const extra = total - base * 3;
  return { term1Due: base + extra, term2Due: base, term3Due: base };
}

// GET: fetch students with fee data
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const cls    = searchParams.get('class');
    const section = searchParams.get('section');
    const academicYear = searchParams.get('academicYear');

    const where = { status: 'Active' };
    if (branch)       where.branch       = branch;
    if (cls)          where.class        = cls;
    if (section)      where.section      = section;
    if (academicYear) where.academicYear = academicYear;

    console.log('📋 Fee API GET:', where);

    const students = await prisma.student.findMany({
      where,
      orderBy: [{ class: 'asc' }, { section: 'asc' }, { rollNo: 'asc' }],
    });

    const data = students.map(s => {
      const total = Number(s.totalFee) || 0;
      const t1    = Number(s.term1)    || 0;
      const t2    = Number(s.term2)    || 0;
      const t3    = Number(s.term3)    || 0;
      const paid  = t1 + t2 + t3;

      let term1Due = Number(s.term1Due) || 0;
      let term2Due = Number(s.term2Due) || 0;
      let term3Due = Number(s.term3Due) || 0;

      // Compute if not set
      if (total > 0 && term1Due === 0 && term2Due === 0 && term3Due === 0) {
        const base  = Math.floor(total / 3);
        const extra = total - base * 3;
        term1Due = Math.max(0, (base + extra) - t1);
        term2Due = Math.max(0, base - t2);
        term3Due = Math.max(0, base - t3);
      }

      return {
        ...s,
        totalFee: total,
        paidFee:  paid,
        term1: t1, term2: t2, term3: t3,
        term1Due, term2Due, term3Due,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('❌ GET fee error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: update term payments
export async function POST(req) {
  try {
    const body = await req.json();
    const { studentId, term1, term2, term3 } = body;

    console.log('📝 Fee update request:', { studentId, term1, term2, term3 });

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
    }

    const t1   = Number(term1) || 0;
    const t2   = Number(term2) || 0;
    const t3   = Number(term3) || 0;
    const paid = t1 + t2 + t3;

    // Fetch current student
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      console.log('❌ Student not found:', studentId);
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const total = Number(student.totalFee) || 0;
    const base  = total > 0 ? Math.floor(total / 3) : 0;
    const extra = total > 0 ? total - base * 3 : 0;

    const updateData = {
      term1:    t1,
      term2:    t2,
      term3:    t3,
      paidFee:  paid,
      term1Due: Math.max(0, (base + extra) - t1),
      term2Due: Math.max(0, base - t2),
      term3Due: Math.max(0, base - t3),
    };

    console.log('📝 Updating student fee:', {
      id: studentId,
      name: student.name,
      ...updateData
    });

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    console.log('✅ Fee updated successfully:', updated.name, {
      term1: updated.term1,
      term2: updated.term2,
      term3: updated.term3,
      paidFee: updated.paidFee,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('❌ POST fee error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}   