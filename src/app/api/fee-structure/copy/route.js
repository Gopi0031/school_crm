import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Copy fee structure from one year to another
export async function POST(req) {
  try {
    const { fromYear, toYear, branch, branchId, percentageIncrease = 0 } = await req.json();

    if (!fromYear || !toYear || !branch) {
      return NextResponse.json({ 
        success: false, 
        error: 'fromYear, toYear, and branch are required' 
      }, { status: 400 });
    }

    const existingFees = await prisma.feeStructure.findMany({
      where: { academicYear: fromYear, branch, isActive: true },
    });

    if (existingFees.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No fee structure found for source year' 
      }, { status: 404 });
    }

    const multiplier = 1 + (percentageIncrease / 100);
    let created = 0;

    for (const fee of existingFees) {
      const existing = await prisma.feeStructure.findFirst({
        where: { academicYear: toYear, branch, class: fee.class },
      });

      if (!existing) {
        await prisma.feeStructure.create({
          data: {
            academicYear: toYear,
            branch,
            branchId,
            class: fee.class,
            totalFee: Math.round(fee.totalFee * multiplier),
            term1Fee: Math.round(fee.term1Fee * multiplier),
            term2Fee: Math.round(fee.term2Fee * multiplier),
            term3Fee: Math.round(fee.term3Fee * multiplier),
            tuitionFee: Math.round((fee.tuitionFee || 0) * multiplier),
            admissionFee: Math.round((fee.admissionFee || 0) * multiplier),
            examFee: Math.round((fee.examFee || 0) * multiplier),
            labFee: Math.round((fee.labFee || 0) * multiplier),
            libraryFee: Math.round((fee.libraryFee || 0) * multiplier),
            sportsFee: Math.round((fee.sportsFee || 0) * multiplier),
            transportFee: Math.round((fee.transportFee || 0) * multiplier),
            otherFee: Math.round((fee.otherFee || 0) * multiplier),
            description: fee.description,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} fee structures for ${toYear}`,
      created,
    });
  } catch (err) {
    console.error('[Copy fee structure]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}