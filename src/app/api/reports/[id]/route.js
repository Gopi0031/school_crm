import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const marksObtained = Number(body.marksObtained) || 0;
    const totalMarks = Number(body.totalMarks) || 100;
    const pct = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;

    const updateData = {
      ...body,
      marksObtained,
      totalMarks,
      percentage: pct,
      status: pct >= 35 ? 'Pass' : 'Fail',
      updatedAt: new Date(),
    };

    const report = await prisma.report.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: report });
  } catch (err) {
    console.error('[PUT /api/reports/[id]]', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    await prisma.report.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    console.error('[DELETE /api/reports/[id]]', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}