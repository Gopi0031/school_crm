import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: event });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const body = await req.json();

    const data = {};

    const allowed = [
      'name','date','startTime','endTime','description','branch','class','section',
      'academicYear','eventType','visibility','posterImage','posterPublicId','images',
      'isPublished','isDraft','isPinned','venue','requiresRegistration',
      'maxParticipants','createdBy','createdByName',
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    // registrationDeadline: only set if non-empty
    if (body.registrationDeadline !== undefined) {
      data.registrationDeadline = body.registrationDeadline?.trim() !== ''
        ? body.registrationDeadline
        : '';
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, data: event });
  } catch (err) {
    console.error('PUT /api/events/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await prisma.event.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}