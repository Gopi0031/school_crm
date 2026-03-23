import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteImage } from '@/lib/cloudinary';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Get existing event to check for image changes
    const existing = await prisma.event.findUnique({ where: { id } });

    // If poster is being replaced, delete old one from Cloudinary
    if (body.posterPublicId !== undefined && 
        existing?.posterPublicId && 
        existing.posterPublicId !== body.posterPublicId) {
      try {
        await deleteImage(existing.posterPublicId);
      } catch (e) {
        console.error('Failed to delete old image:', e);
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: event });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Get event to delete associated images
    const event = await prisma.event.findUnique({ where: { id } });

    if (event) {
      // Delete poster from Cloudinary
      if (event.posterPublicId) {
        try {
          await deleteImage(event.posterPublicId);
        } catch (e) {
          console.error('Failed to delete poster:', e);
        }
      }

      // Delete gallery images from Cloudinary
      if (event.images && Array.isArray(event.images)) {
        for (const img of event.images) {
          if (img.publicId) {
            try {
              await deleteImage(img.publicId);
            } catch (e) {
              console.error('Failed to delete gallery image:', e);
            }
          }
        }
      }
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}