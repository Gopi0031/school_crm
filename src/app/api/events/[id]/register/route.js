import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req, { params }) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();

    // Check if event exists and accepts registration
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.requiresRegistration) {
      return NextResponse.json({ error: 'This event does not require registration' }, { status: 400 });
    }

    // Check if max participants reached
    if (event.maxParticipants > 0 && event.registeredCount >= event.maxParticipants) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 });
    }

    // Check registration deadline
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (new Date() > deadline) {
        return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
      }
    }

    // Check if already registered
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: body.userId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 });
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId: body.userId,
        userName: body.userName || '',
        userRole: body.userRole || '',
        userClass: body.userClass || '',
        userSection: body.userSection || '',
        branch: body.branch || '',
      }
    });

    // Update registered count
    await prisma.event.update({
      where: { id: eventId },
      data: { registeredCount: { increment: 1 } }
    });

    return NextResponse.json({ success: true, data: registration });
  } catch (err) {
    console.error('Event registration error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const { id: eventId } = await params;

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      orderBy: { registeredAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: registrations });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    await prisma.eventRegistration.delete({
      where: {
        eventId_userId: { eventId, userId }
      }
    });

    // Decrement registered count
    await prisma.event.update({
      where: { id: eventId },
      data: { registeredCount: { decrement: 1 } }
    });

    return NextResponse.json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}