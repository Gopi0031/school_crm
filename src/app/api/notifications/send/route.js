import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();

    const notification = await prisma.notification.create({
      data: {
        title: body.title,
        message: body.message,
        type: body.type || 'event',
        priority: body.priority || 'normal',
        targetRole: body.visibility || ['All'],
        targetBranch: body.branch || 'All',
        targetClass: body.class || 'All',
        targetSection: body.section || 'All',
        relatedType: body.type || '',
        relatedId: body.eventId || '',
        image: body.image || '',
        link: body.link || '',
        createdBy: body.createdBy || '',
      },
    });

    // Update event notification status if this is for an event
    if (body.eventId) {
      await prisma.event.update({
        where: { id: body.eventId },
        data: {
          notificationSent: true,
          notifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, data: notification });
  } catch (err) {
    console.error('Send notification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}