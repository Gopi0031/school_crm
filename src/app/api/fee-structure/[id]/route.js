import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.feeStructure.update({
      where: { id },
      data: {
        ...body,
        totalFee: Number(body.totalFee) || 0,
        term1Fee: Number(body.term1Fee) || 0,
        term2Fee: Number(body.term2Fee) || 0,
        term3Fee: Number(body.term3Fee) || 0,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await prisma.feeStructure.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}