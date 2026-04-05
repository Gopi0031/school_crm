import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req, context) {
  try {
    // ✅ FIX: Await params in Next.js 15+
    const { id } = await context.params;
    
    console.log('📝 PUT /api/fee-structure/[id]', { id });

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const body = await req.json();
    console.log('📝 Update data:', body);

    // ✅ Ensure all numeric fields are integers
    const updated = await prisma.feeStructure.update({
      where: { id },
      data: {
        class: body.class,
        description: body.description || '',
        totalFee: parseInt(body.totalFee, 10) || 0,
        term1Fee: parseInt(body.term1Fee, 10) || 0,
        term2Fee: parseInt(body.term2Fee, 10) || 0,
        term3Fee: parseInt(body.term3Fee, 10) || 0,
        tuitionFee: parseInt(body.tuitionFee, 10) || 0,
        admissionFee: parseInt(body.admissionFee, 10) || 0,
        examFee: parseInt(body.examFee, 10) || 0,
        labFee: parseInt(body.labFee, 10) || 0,
        libraryFee: parseInt(body.libraryFee, 10) || 0,
        sportsFee: parseInt(body.sportsFee, 10) || 0,
        transportFee: parseInt(body.transportFee, 10) || 0,
        otherFee: parseInt(body.otherFee, 10) || 0,
      },
    });

    console.log('✅ Fee structure updated:', updated.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PUT fee-structure]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    // ✅ FIX: Await params in Next.js 15+
    const { id } = await context.params;
    
    console.log('🗑️ DELETE /api/fee-structure/[id]', { id });

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await prisma.feeStructure.delete({ where: { id } });
    
    console.log('✅ Fee structure deleted:', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE fee-structure]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Optional: GET single fee structure
export async function GET(req, context) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const fee = await prisma.feeStructure.findUnique({
      where: { id },
    });

    if (!fee) {
      return NextResponse.json({ success: false, error: 'Fee structure not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: fee });
  } catch (err) {
    console.error('[GET fee-structure/id]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}