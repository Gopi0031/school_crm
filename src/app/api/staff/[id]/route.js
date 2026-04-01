import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteImage } from '@/lib/cloudinary';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: staff });
  } catch (err) {
    console.error('[GET /api/staff/[id]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Strip fields that shouldn't be updated directly
    const { id: _id, createdAt, updatedAt, ...updateData } = body;

    const staff = await prisma.staff.update({
      where: { id },
      data:  updateData,
    });

    return NextResponse.json({ success: true, data: staff });
  } catch (err) {
    console.error('[PUT /api/staff/[id]]', err);
    if (err.code === 'P2025')
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    if (staff.profileImagePublicId) await deleteImage(staff.profileImagePublicId);

    await prisma.staff.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Staff deleted' });
  } catch (err) {
    console.error('[DELETE /api/staff/[id]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
