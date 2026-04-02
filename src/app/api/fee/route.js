import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ═══════════════════════════════════════════════════════════════════════════
// GET - Fetch students with fee data
// ═══════════════════════════════════════════════════════════════════════════
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch       = searchParams.get('branch');
    const cls          = searchParams.get('class');
    const section      = searchParams.get('section');
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

    // ✅ Normalize all fee values to proper integers
    const data = students.map(s => {
      const total = Math.round(Number(s.totalFee) || 0);
      const t1    = Math.round(Number(s.term1)    || 0);
      const t2    = Math.round(Number(s.term2)    || 0);
      const t3    = Math.round(Number(s.term3)    || 0);
      const paid  = t1 + t2 + t3;

      // Calculate expected term amounts
      const base = total > 0 ? Math.floor(total / 3) : 0;
      const remainder = total > 0 ? total - (base * 3) : 0;
      const expected1 = base + remainder;
      const expected2 = base;
      const expected3 = base;

      // Get stored dues or calculate
      let term1Due = Math.round(Number(s.term1Due) || 0);
      let term2Due = Math.round(Number(s.term2Due) || 0);
      let term3Due = Math.round(Number(s.term3Due) || 0);

      // Recalculate if dues are all zero but there's unpaid fee
      if (total > 0 && term1Due === 0 && term2Due === 0 && term3Due === 0 && paid < total) {
        term1Due = Math.max(0, expected1 - t1);
        term2Due = Math.max(0, expected2 - t2);
        term3Due = Math.max(0, expected3 - t3);
      }

      return {
        ...s,
        totalFee: total,
        paidFee:  paid,
        term1:    t1,
        term2:    t2,
        term3:    t3,
        term1Due,
        term2Due,
        term3Due,
      };
    });

    console.log('✅ Fee API: Found', data.length, 'students');

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('❌ GET fee error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - Update term payments
// ═══════════════════════════════════════════════════════════════════════════
export async function POST(req) {
  try {
    const body = await req.json();
    const { studentId, term1, term2, term3 } = body;

    console.log('📝 Fee update request:', { studentId, term1, term2, term3 });

    if (!studentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID required' 
      }, { status: 400 });
    }

    // ✅ Round all values to integers
    const t1   = Math.round(Number(term1) || 0);
    const t2   = Math.round(Number(term2) || 0);
    const t3   = Math.round(Number(term3) || 0);
    const newPaidTotal = t1 + t2 + t3;

    // Fetch current student
    const student = await prisma.student.findUnique({ 
      where: { id: studentId } 
    });
    
    if (!student) {
      console.log('❌ Student not found:', studentId);
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found' 
      }, { status: 404 });
    }

    // Calculate expected amounts with proper integer math
    const total = Math.round(Number(student.totalFee) || 0);
    
    if (total === 0) {
      return NextResponse.json({
        success: false,
        error: 'Total fee not set for this student. Please set total fee first.',
      }, { status: 400 });
    }

    const base  = Math.floor(total / 3);
    const remainder = total - (base * 3);
    
    const expected1 = base + remainder;
    const expected2 = base;
    const expected3 = base;

    // Validate term payments don't exceed expected amounts
    if (t1 > expected1) {
      return NextResponse.json({
        success: false,
        error: `Term 1 payment (₹${t1}) exceeds expected amount (₹${expected1})`,
      }, { status: 400 });
    }
    if (t2 > expected2) {
      return NextResponse.json({
        success: false,
        error: `Term 2 payment (₹${t2}) exceeds expected amount (₹${expected2})`,
      }, { status: 400 });
    }
    if (t3 > expected3) {
      return NextResponse.json({
        success: false,
        error: `Term 3 payment (₹${t3}) exceeds expected amount (₹${expected3})`,
      }, { status: 400 });
    }

    // Calculate old paid total for payment history
    const oldPaidTotal = Math.round(
      (Number(student.term1) || 0) + 
      (Number(student.term2) || 0) + 
      (Number(student.term3) || 0)
    );
    const amountAdded = newPaidTotal - oldPaidTotal;

    const updateData = {
      term1:    t1,
      term2:    t2,
      term3:    t3,
      paidFee:  newPaidTotal,
      term1Due: Math.max(0, expected1 - t1),
      term2Due: Math.max(0, expected2 - t2),
      term3Due: Math.max(0, expected3 - t3),
    };

    console.log('📝 Updating student fee:', {
      id: studentId,
      name: student.name,
      totalFee: total,
      oldPaid: oldPaidTotal,
      newPaid: newPaidTotal,
      amountAdded,
      ...updateData,
    });

    // Update student fee
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    // ✅ Create payment history record if amount changed
    if (amountAdded !== 0) {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        await prisma.feePayment.create({
          data: {
            studentId: student.id,
            studentName: student.name,
            rollNo: student.rollNo || '',
            class: student.class || '',
            section: student.section || '',
            branch: student.branch || '',
            branchId: student.branchId || '',
            academicYear: student.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
            amount: amountAdded,
            paymentType: 'manual',
            paymentFor: 'term_payment',
            termNumber: 0, // Will be updated if needed
            receiptNo: `FEE-${Date.now()}`,
            transactionId: '',
            remarks: `Updated: Term1=₹${t1}, Term2=₹${t2}, Term3=₹${t3}`,
            paidDate: today,
            collectedBy: 'Branch Admin',
          },
        });
        console.log('✅ Payment history created:', amountAdded);
      } catch (paymentErr) {
        console.warn('⚠️ Payment history not created:', paymentErr.message);
      }
    }

    console.log('✅ Fee updated successfully:', updated.name, {
      term1: updated.term1,
      term2: updated.term2,
      term3: updated.term3,
      paidFee: updated.paidFee,
      totalDue: total - newPaidTotal,
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...updated,
        totalFee:  Math.round(Number(updated.totalFee)  || 0),
        paidFee:   Math.round(Number(updated.paidFee)   || 0),
        term1:     Math.round(Number(updated.term1)     || 0),
        term2:     Math.round(Number(updated.term2)     || 0),
        term3:     Math.round(Number(updated.term3)     || 0),
        term1Due:  Math.round(Number(updated.term1Due)  || 0),
        term2Due:  Math.round(Number(updated.term2Due)  || 0),
        term3Due:  Math.round(Number(updated.term3Due)  || 0),
      }
    });
  } catch (err) {
    console.error('❌ POST fee error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}