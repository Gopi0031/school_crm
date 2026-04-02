import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Activate an academic year (set as current)
export async function POST(req) {
  try {
    const { yearId, branch } = await req.json();

    if (!yearId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Year ID required' 
      }, { status: 400 });
    }

    // Deactivate all other years for this branch
    await prisma.academicYear.updateMany({
      where: {
        branch: branch || 'All',
        isCurrent: true,
      },
      data: {
        isCurrent: false,
        status: 'completed',
      },
    });

    // Activate the selected year
    const activated = await prisma.academicYear.update({
      where: { id: yearId },
      data: {
        isCurrent: true,
        status: 'active',
      },
    });

    return NextResponse.json({ success: true, data: activated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}