import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const pct    = body.totalMarks ? Math.round(body.marksObtained / body.totalMarks * 100) : 0;
    body.percentage = pct;
    body.status     = pct >= 35 ? 'Pass' : 'Fail';

    const report = await prisma.report.update({ where: { id }, data: body });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: report });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const report = await prisma.report.delete({ where: { id } });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
