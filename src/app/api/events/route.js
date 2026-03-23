import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const cls = searchParams.get('class');
    const eventType = searchParams.get('eventType');
    const visibility = searchParams.get('visibility');
    const published = searchParams.get('published');
    const upcoming = searchParams.get('upcoming');

    const where = {};

    // Branch filter
    if (branch) {
      where.OR = [{ branch }, { branch: 'All' }];
    }

    // Class filter
    if (cls) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [{ class: cls }, { class: 'All' }]
      });
    }

    // Event type filter
    if (eventType) {
      where.eventType = eventType;
    }

    // Visibility filter (for role-based access)
    if (visibility) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { visibility: { has: visibility } },
          { visibility: { has: 'All' } }
        ]
      });
    }

    // Published filter
    if (published === 'true') {
      where.isPublished = true;
    }

    // Upcoming events only
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      where.date = { gte: today };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { date: 'asc' }
      ],
    });

    return NextResponse.json({ success: true, data: events });
  } catch (err) {
    console.error('GET events error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const event = await prisma.event.create({
      data: {
        name: body.name,
        description: body.description || '',
        date: body.date,
        startTime: body.startTime || '',
        endTime: body.endTime || '',
        branch: body.branch || 'All',
        class: body.class || 'All',
        section: body.section || 'All',
        academicYear: body.academicYear || '2024-25',
        eventType: body.eventType || 'General',
        visibility: body.visibility || ['All'],
        posterImage: body.posterImage || null,
        posterPublicId: body.posterPublicId || null,
        images: body.images || [],
        isPublished: body.isPublished ?? true,
        isDraft: body.isDraft ?? false,
        isPinned: body.isPinned ?? false,
        venue: body.venue || '',
        requiresRegistration: body.requiresRegistration ?? false,
        maxParticipants: body.maxParticipants || 0,
        registrationDeadline: body.registrationDeadline || '',
        createdBy: body.createdBy || '',
        createdByName: body.createdByName || '',
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (err) {
    console.error('POST event error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}