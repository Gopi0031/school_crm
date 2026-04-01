import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required',
        data: null 
      }, { status: 400 });
    }

    // Validate ObjectId format for MongoDB
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
    
    if (!isValidObjectId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid student ID format',
        data: null 
      }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ 
      where: { id } 
    });
    
    if (!student) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found',
        data: null 
      }, { status: 404 });
    }

    // Compute fee values
    const total = Number(student.totalFee) || 0;
    const t1    = Number(student.term1)    || 0;
    const t2    = Number(student.term2)    || 0;
    const t3    = Number(student.term3)    || 0;
    const paid  = t1 + t2 + t3;

    return NextResponse.json({ 
      success: true, 
      data: {
        ...student,
        paidFee: paid,
      }
    });
  } catch (err) {
    console.error('GET /api/students/[id] error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Server error',
      data: null 
    }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required',
        data: null 
      }, { status: 400 });
    }

    const existing = await prisma.student.findUnique({ 
      where: { id } 
    });
    
    if (!existing) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found',
        data: null 
      }, { status: 404 });
    }

    // Build update data
    const updateData = {};
    
    // Fee fields
    if (body.totalFee !== undefined)  updateData.totalFee = Number(body.totalFee) || 0;
    if (body.paidFee !== undefined)   updateData.paidFee  = Number(body.paidFee)  || 0;
    if (body.term1 !== undefined)     updateData.term1    = Number(body.term1)    || 0;
    if (body.term2 !== undefined)     updateData.term2    = Number(body.term2)    || 0;
    if (body.term3 !== undefined)     updateData.term3    = Number(body.term3)    || 0;
    if (body.term1Due !== undefined)  updateData.term1Due = Number(body.term1Due) || 0;
    if (body.term2Due !== undefined)  updateData.term2Due = Number(body.term2Due) || 0;
    if (body.term3Due !== undefined)  updateData.term3Due = Number(body.term3Due) || 0;

    // String fields
    const stringFields = [
      'name', 'rollNo', 'class', 'section', 'gender', 'bloodGroup', 
      'caste', 'aadhaar', 'address', 'parentName', 'phone', 'email',
      'branch', 'branchId', 'academicYear', 'yearOfJoining', 
      'dateOfJoining', 'status', 'username', 'todayAttendance'
    ];
    
    stringFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Integer fields
    const intFields = ['presentDays', 'absentDays', 'totalWorkingDays'];
    intFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = Number(body[field]) || 0;
      }
    });

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      data: updated 
    });
  } catch (err) {
    console.error('PATCH /api/students/[id] error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to update',
      data: null 
    }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required' 
      }, { status: 400 });
    }

    await prisma.student.delete({ where: { id } });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Student deleted successfully' 
    });
  } catch (err) {
    console.error('DELETE /api/students/[id] error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to delete' 
    }, { status: 500 });
  }
}