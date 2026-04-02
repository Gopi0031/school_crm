import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch academic years
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const current = searchParams.get('current');

    const where = {};
    if (branch && branch !== 'All') {
      where.OR = [{ branch }, { branch: 'All' }];
    }
    if (current === 'true') {
      where.isCurrent = true;
    }

    const years = await prisma.academicYear.findMany({
      where,
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({ success: true, data: years });
  } catch (err) {
    console.error('[Academic Year GET Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Create new academic year
export async function POST(req) {
  try {
    const body = await req.json();
    const { year, startDate, endDate, branch = 'All', branchId = '', createdBy = '' } = body;

    if (!year) {
      return NextResponse.json({ success: false, error: 'Year is required' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.academicYear.findFirst({
      where: { year, branch },
    });

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: 'Academic year already exists for this branch' 
      }, { status: 400 });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        startDate: startDate || '',
        endDate: endDate || '',
        branch,
        branchId,
        status: 'upcoming',
        isCurrent: false,
        createdBy,
      },
    });

    return NextResponse.json({ success: true, data: academicYear });
  } catch (err) {
    console.error('[Academic Year POST Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}