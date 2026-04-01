// src/app/api/students/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET single student
export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Compute fee data
    const total = Number(student.totalFee) || 0;
    const t1 = Number(student.term1) || 0;
    const t2 = Number(student.term2) || 0;
    const t3 = Number(student.term3) || 0;
    const paid = t1 + t2 + t3;

    let term1Due = 0, term2Due = 0, term3Due = 0;
    if (total > 0) {
      const base = Math.floor(total / 3);
      const extra = total - base * 3;
      term1Due = Math.max(0, (base + extra) - t1);
      term2Due = Math.max(0, base - t2);
      term3Due = Math.max(0, base - t3);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...student,
        totalFee: total,
        paidFee: paid,
        term1: t1,
        term2: t2,
        term3: t3,
        term1Due,
        term2Due,
        term3Due,
      },
    });
  } catch (err) {
    console.error('GET student error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Update student (including fee data)
export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if student exists
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Build update data - only include fields that are provided
    const updateData = {};

    // Fee-related fields
    if (body.totalFee !== undefined) updateData.totalFee = Number(body.totalFee) || 0;
    if (body.paidFee !== undefined) updateData.paidFee = Number(body.paidFee) || 0;
    if (body.term1 !== undefined) updateData.term1 = Number(body.term1) || 0;
    if (body.term2 !== undefined) updateData.term2 = Number(body.term2) || 0;
    if (body.term3 !== undefined) updateData.term3 = Number(body.term3) || 0;
    if (body.term1Due !== undefined) updateData.term1Due = Number(body.term1Due) || 0;
    if (body.term2Due !== undefined) updateData.term2Due = Number(body.term2Due) || 0;
    if (body.term3Due !== undefined) updateData.term3Due = Number(body.term3Due) || 0;

    // Other student fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.rollNo !== undefined) updateData.rollNo = body.rollNo;
    if (body.class !== undefined) updateData.class = body.class;
    if (body.section !== undefined) updateData.section = body.section;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
    if (body.caste !== undefined) updateData.caste = body.caste;
    if (body.aadhaar !== undefined) updateData.aadhaar = body.aadhaar;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.parentName !== undefined) updateData.parentName = body.parentName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    // Return computed fee data
    const total = Number(updated.totalFee) || 0;
    const t1 = Number(updated.term1) || 0;
    const t2 = Number(updated.term2) || 0;
    const t3 = Number(updated.term3) || 0;
    const paid = t1 + t2 + t3;

    let term1Due = 0, term2Due = 0, term3Due = 0;
    if (total > 0) {
      const base = Math.floor(total / 3);
      const extra = total - base * 3;
      term1Due = Math.max(0, (base + extra) - t1);
      term2Due = Math.max(0, base - t2);
      term3Due = Math.max(0, base - t3);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        totalFee: total,
        paidFee: paid,
        term1: t1,
        term2: t2,
        term3: t3,
        term1Due,
        term2Due,
        term3Due,
      },
    });
  } catch (err) {
    console.error('PATCH student error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE student
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    await prisma.student.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    console.error('DELETE student error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}