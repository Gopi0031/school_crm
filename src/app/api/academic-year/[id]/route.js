import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT - Update academic year
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.academicYear.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const year = await prisma.academicYear.findUnique({ where: { id } });
    if (year?.isCurrent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete current academic year' 
      }, { status: 400 });
    }

    await prisma.academicYear.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}