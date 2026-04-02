import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch') || '';

    // Get current academic year from AcademicYear table
    const currentYear = await prisma.academicYear.findFirst({
      where: { 
        isCurrent: true,
        ...(branch && branch !== 'All' && { 
          OR: [{ branch }, { branch: 'All' }] 
        }),
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        academicYear: currentYear?.year || '2025-26',
        branch,
        academicYearId: currentYear?.id,
      } 
    });
  } catch (err) {
    console.error('[GET settings]', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { branch = '', academicYear, yearId } = await req.json();
    
    if (!academicYear) {
      return NextResponse.json({ 
        success: false, 
        error: 'academicYear is required' 
      }, { status: 400 });
    }

    // Activate the academic year
    if (yearId) {
      // Deactivate all other years for this branch
      await prisma.academicYear.updateMany({
        where: {
          ...(branch && { branch }),
          isCurrent: true,
        },
        data: {
          isCurrent: false,
          status: 'completed',
        },
      });

      // Activate selected year
      await prisma.academicYear.update({
        where: { id: yearId },
        data: {
          isCurrent: true,
          status: 'active',
        },
      });
    }

    // Update teachers
    const teacherResult = await prisma.teacher.updateMany({
      where: { 
        ...(branch && { branch }), 
        status: 'Active' 
      },
      data: { academicYear },
    });

    // Note: Don't reset student fees here - that's done during rollover
    // Just update the academic year
    const studentResult = await prisma.student.updateMany({
      where: branch ? { branch } : {},
      data: { academicYear },
    });

    return NextResponse.json({
      success: true,
      message: `Academic year updated to ${academicYear}`,
      teachersUpdated: teacherResult.count,
      studentsUpdated: studentResult.count,
    });
  } catch (err) {
    console.error('[POST settings]', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}