import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch    = searchParams.get('branch');
    const role      = searchParams.get('role');
    const cls       = searchParams.get('class');
    const eventType = searchParams.get('eventType');
    const published = searchParams.get('published');
    const upcoming  = searchParams.get('upcoming');

    const AND = [];

    // ── Branch scoping ──────────────────────────────────────────────
    // super-admin → all events (no filter)
    // everyone else → own branch events + school-wide (branch = 'All')
    if (role !== 'super-admin' && branch) {
      AND.push({
        OR: [
          { branch: branch },
          { branch: 'All' },
        ],
      });
    }

    // Optional class filter
    if (cls) {
      AND.push({ OR: [{ class: cls }, { class: 'All' }] });
    }

    // Optional eventType filter
    if (eventType) {
      AND.push({ eventType });
    }

    // Only published events
    if (published === 'true') {
      AND.push({ isPublished: true });
      AND.push({ isDraft: false });
    }

    // Only upcoming (today or future)
    if (upcoming === 'true') {
      const todayStr = new Date().toISOString().split('T')[0];
      AND.push({ date: { gte: todayStr } });
    }

    const events = await prisma.event.findMany({
      where: AND.length > 0 ? { AND } : {},
      orderBy: [{ isPinned: 'desc' }, { date: 'asc' }],
    });

    return NextResponse.json({ success: true, data: events });
  } catch (err) {
    console.error('GET /api/events error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name, date,
      startTime        = '',
      endTime          = '',
      description      = '',
      branch           = 'All',
      class: cls       = 'All',
      section          = 'All',
      academicYear     = '2025-26',
      eventType        = 'General',
      visibility       = ['All'],
      posterImage      = null,
      posterPublicId   = null,
      images           = [],
      isPublished      = true,
      isDraft          = false,
      isPinned         = false,
      venue            = '',
      requiresRegistration = false,
      maxParticipants  = 0,
      createdBy        = '',
      createdByName    = '',
    } = body;

    if (!name || !date) {
      return NextResponse.json({ error: 'name and date are required' }, { status: 400 });
    }

    const data = {
      name,
      date,
      startTime,
      endTime,
      description,
      branch,
      class: cls,
      section,
      academicYear,
      eventType,
      visibility,
      images,
      isPublished,
      isDraft,
      isPinned,
      venue,
      requiresRegistration,
      maxParticipants,
      createdBy,
      createdByName,
    };

    // Only set optional nullable fields if provided
    if (posterImage)    data.posterImage    = posterImage;
    if (posterPublicId) data.posterPublicId = posterPublicId;

    // registrationDeadline: only set if non-empty
    if (body.registrationDeadline && body.registrationDeadline.trim() !== '') {
      data.registrationDeadline = body.registrationDeadline;
    }

    const event = await prisma.event.create({ data });
    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (err) {
    console.error('POST /api/events error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}