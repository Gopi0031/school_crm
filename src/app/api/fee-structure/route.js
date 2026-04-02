import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch fee structures
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const academicYear = searchParams.get('academicYear');
    const className = searchParams.get('class');

    console.log('📋 GET /api/fee-structure', { branch, academicYear, className });

    const where = { isActive: true };
    if (branch) where.branch = branch;
    if (academicYear) where.academicYear = academicYear;
    if (className) where.class = className;

    const fees = await prisma.feeStructure.findMany({
      where,
      orderBy: [{ class: 'asc' }],
    });

    // ✅ Ensure all fee values are proper integers
    const normalizedFees = fees.map(f => ({
      ...f,
      totalFee: Math.round(f.totalFee || 0),
      term1Fee: Math.round(f.term1Fee || 0),
      term2Fee: Math.round(f.term2Fee || 0),
      term3Fee: Math.round(f.term3Fee || 0),
      tuitionFee: Math.round(f.tuitionFee || 0),
      admissionFee: Math.round(f.admissionFee || 0),
      examFee: Math.round(f.examFee || 0),
      labFee: Math.round(f.labFee || 0),
      libraryFee: Math.round(f.libraryFee || 0),
      sportsFee: Math.round(f.sportsFee || 0),
      transportFee: Math.round(f.transportFee || 0),
      otherFee: Math.round(f.otherFee || 0),
    }));

    console.log('📋 Found', normalizedFees.length, 'fee structures');

    return NextResponse.json({ success: true, data: normalizedFees });
  } catch (err) {
    console.error('[GET fee-structure]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Create fee structure
export async function POST(req) {
  try {
    const body = await req.json();
    console.log('💾 POST /api/fee-structure', body);

    const {
      academicYear,
      branch,
      branchId = '',
      class: className,
      totalFee = 0,
      term1Fee = 0,
      term2Fee = 0,
      term3Fee = 0,
      tuitionFee = 0,
      admissionFee = 0,
      examFee = 0,
      labFee = 0,
      libraryFee = 0,
      sportsFee = 0,
      transportFee = 0,
      otherFee = 0,
      description = '',
      createdBy = '',
    } = body;

    if (!academicYear || !branch || !className) {
      return NextResponse.json({
        success: false,
        error: 'Academic year, branch, and class are required',
      }, { status: 400 });
    }

    // ✅ Round all values to integers to avoid floating point issues
    const roundedData = {
      totalFee: Math.round(Number(totalFee) || 0),
      term1Fee: Math.round(Number(term1Fee) || 0),
      term2Fee: Math.round(Number(term2Fee) || 0),
      term3Fee: Math.round(Number(term3Fee) || 0),
      tuitionFee: Math.round(Number(tuitionFee) || 0),
      admissionFee: Math.round(Number(admissionFee) || 0),
      examFee: Math.round(Number(examFee) || 0),
      labFee: Math.round(Number(labFee) || 0),
      libraryFee: Math.round(Number(libraryFee) || 0),
      sportsFee: Math.round(Number(sportsFee) || 0),
      transportFee: Math.round(Number(transportFee) || 0),
      otherFee: Math.round(Number(otherFee) || 0),
    };

    // ✅ Auto-calculate term fees if not provided but total is
    if (roundedData.totalFee > 0 && roundedData.term1Fee === 0 && roundedData.term2Fee === 0 && roundedData.term3Fee === 0) {
      const total = roundedData.totalFee;
      const base = Math.floor(total / 3);
      const remainder = total - (base * 3);
      
      // Distribute remainder to term1
      roundedData.term1Fee = base + remainder;
      roundedData.term2Fee = base;
      roundedData.term3Fee = base;
      
      console.log('📊 Auto-split terms:', { term1: roundedData.term1Fee, term2: roundedData.term2Fee, term3: roundedData.term3Fee, total: roundedData.term1Fee + roundedData.term2Fee + roundedData.term3Fee });
    }

    // Check if already exists
    const existing = await prisma.feeStructure.findFirst({
      where: { academicYear, branch, class: className },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.feeStructure.update({
        where: { id: existing.id },
        data: {
          ...roundedData,
          description,
        },
      });
      console.log('✅ Updated existing fee structure:', updated.id);
      return NextResponse.json({ success: true, data: updated, updated: true });
    }

    // Create new
    const fee = await prisma.feeStructure.create({
      data: {
        academicYear,
        branch,
        branchId,
        class: className,
        ...roundedData,
        description,
        createdBy,
        isActive: true,
      },
    });

    console.log('✅ Created new fee structure:', fee.id, 'Total:', fee.totalFee);
    return NextResponse.json({ success: true, data: fee });
  } catch (err) {
    console.error('[POST fee-structure]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}