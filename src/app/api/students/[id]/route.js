// src/app/api/students/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// ═══════════════════════════════════════════════════════════════════════════
// GET - Fetch single student by ID
// ═══════════════════════════════════════════════════════════════════════════
export async function GET(req, { params }) {
  try {
    const { id } = await params;  // ✅ MUST await params in Next.js 14+

    console.log('📋 GET /api/students/ id:', id);

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

    // ✅ Compute and normalize fee values
    const totalFee = Math.round(Number(student.totalFee) || 0);
    const term1    = Math.round(Number(student.term1)    || 0);
    const term2    = Math.round(Number(student.term2)    || 0);
    const term3    = Math.round(Number(student.term3)    || 0);
    const paidFee  = term1 + term2 + term3;

    // Compute term dues
    let term1Due = Math.round(Number(student.term1Due) || 0);
    let term2Due = Math.round(Number(student.term2Due) || 0);
    let term3Due = Math.round(Number(student.term3Due) || 0);

    // Recalculate if dues are all zero but there's a fee
    if (totalFee > 0 && term1Due === 0 && term2Due === 0 && term3Due === 0) {
      const base = Math.floor(totalFee / 3);
      const remainder = totalFee - (base * 3);
      term1Due = Math.max(0, (base + remainder) - term1);
      term2Due = Math.max(0, base - term2);
      term3Due = Math.max(0, base - term3);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...student,
        totalFee,
        paidFee,
        term1,
        term2,
        term3,
        term1Due,
        term2Due,
        term3Due,
      }
    });
  } catch (err) {
    console.error('❌ GET /api/students/[id] error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Server error',
      data: null 
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUT - Full update student
// ═══════════════════════════════════════════════════════════════════════════
export async function PUT(req, { params }) {
  try {
    const { id } = await params;  // ✅ MUST await params in Next.js 14+
    const body = await req.json();

    console.log('📝 PUT /api/students/' + id, Object.keys(body));

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required' 
      }, { status: 400 });
    }

    // Validate ObjectId format
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
    if (!isValidObjectId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid student ID format' 
      }, { status: 400 });
    }

    const existing = await prisma.student.findUnique({ where: { id } });
    
    if (!existing) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found' 
      }, { status: 404 });
    }

    // Extract password fields (don't save directly to student)
    const { password, confirmPassword, ...updateFields } = body;

    // ✅ Process fee fields with proper rounding
    const processedData = { ...updateFields };

    if (updateFields.totalFee !== undefined) {
      processedData.totalFee = Math.round(Number(updateFields.totalFee) || 0);
      
      // Recalculate term dues if totalFee changes
      if (processedData.totalFee > 0) {
        const total = processedData.totalFee;
        const base = Math.floor(total / 3);
        const remainder = total - (base * 3);
        
        // Only update dues if not explicitly provided
        if (updateFields.term1Due === undefined) {
          processedData.term1Due = base + remainder;
        }
        if (updateFields.term2Due === undefined) {
          processedData.term2Due = base;
        }
        if (updateFields.term3Due === undefined) {
          processedData.term3Due = base;
        }
      }
    }

    // Round any fee fields that were provided
    const feeFields = ['paidFee', 'term1', 'term2', 'term3', 'term1Due', 'term2Due', 'term3Due'];
    feeFields.forEach(field => {
      if (processedData[field] !== undefined) {
        processedData[field] = Math.round(Number(processedData[field]) || 0);
      }
    });

    // Integer fields
    const intFields = ['presentDays', 'absentDays', 'totalWorkingDays'];
    intFields.forEach(field => {
      if (processedData[field] !== undefined) {
        processedData[field] = Math.round(Number(processedData[field]) || 0);
      }
    });

    // Update student
    const updated = await prisma.student.update({
      where: { id },
      data: processedData,
    });

    console.log('✅ Student updated:', updated.name);

    // ═══════════════════════════════════════════════════════
    // Handle password update if provided
    // ═══════════════════════════════════════════════════════
    if (password && password.trim().length >= 6) {
      const userId = existing.userId;
      
      if (userId && /^[a-fA-F0-9]{24}$/.test(userId)) {
        try {
          const hashedPwd = await bcrypt.hash(password.trim(), 10);
          await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPwd }
          });
          console.log('✅ Password updated for user:', userId);
        } catch (pwdErr) {
          console.warn('⚠️ Password update failed:', pwdErr.message);
        }
      } else {
        console.warn('⚠️ No valid userId for password update');
      }
    }

    // ═══════════════════════════════════════════════════════
    // Sync user record if exists
    // ═══════════════════════════════════════════════════════
    if (existing.userId && /^[a-fA-F0-9]{24}$/.test(existing.userId)) {
      try {
        await prisma.user.update({
          where: { id: existing.userId },
          data: {
            name:    processedData.name    || existing.name,
            email:   processedData.email   || existing.email,
            phone:   processedData.phone   || existing.phone,
            class:   processedData.class   || existing.class,
            section: processedData.section || existing.section,
          }
        });
        console.log('✅ User synced:', existing.userId);
      } catch (syncErr) {
        console.warn('⚠️ User sync failed:', syncErr.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...updated,
        totalFee:  Math.round(Number(updated.totalFee)  || 0),
        paidFee:   Math.round(Number(updated.paidFee)   || 0),
        term1Due:  Math.round(Number(updated.term1Due)  || 0),
        term2Due:  Math.round(Number(updated.term2Due)  || 0),
        term3Due:  Math.round(Number(updated.term3Due)  || 0),
      }
    });
  } catch (err) {
    console.error('❌ PUT /api/students/[id] error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to update' 
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH - Partial update student (used for fee updates)
// ═══════════════════════════════════════════════════════════════════════════
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;  // ✅ MUST await params in Next.js 14+
    const body = await req.json();

    console.log('📝 PATCH /api/students/' + id, Object.keys(body));

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required',
        data: null 
      }, { status: 400 });
    }

    // Validate ObjectId format
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
    if (!isValidObjectId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid student ID format',
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

    // Build update data with proper rounding
    const updateData = {};
    
    // ✅ Fee fields - ensure proper integer rounding
    const feeFields = ['totalFee', 'paidFee', 'term1', 'term2', 'term3', 'term1Due', 'term2Due', 'term3Due'];
    feeFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = Math.round(Number(body[field]) || 0);
      }
    });

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
        updateData[field] = Math.round(Number(body[field]) || 0);
      }
    });

    console.log('📝 Update data:', updateData);

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Student PATCH updated:', updated.name);

    return NextResponse.json({ 
      success: true, 
      data: {
        ...updated,
        // Ensure response has proper integers
        totalFee:  Math.round(Number(updated.totalFee)  || 0),
        paidFee:   Math.round(Number(updated.paidFee)   || 0),
        term1:     Math.round(Number(updated.term1)     || 0),
        term2:     Math.round(Number(updated.term2)     || 0),
        term3:     Math.round(Number(updated.term3)     || 0),
        term1Due:  Math.round(Number(updated.term1Due)  || 0),
        term2Due:  Math.round(Number(updated.term2Due)  || 0),
        term3Due:  Math.round(Number(updated.term3Due)  || 0),
      }
    });
  } catch (err) {
    console.error('❌ PATCH /api/students/[id] error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to update',
      data: null 
    }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE - Remove student
// ═══════════════════════════════════════════════════════════════════════════
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;  // ✅ MUST await params in Next.js 14+

    console.log('🗑️ DELETE /api/students/ id:', id);

    if (!id) {
      console.log('❌ No ID provided');
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    // ✅ Validate ObjectId format
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
    if (!isValidObjectId) {
      console.log('❌ Invalid ObjectId:', id);
      return NextResponse.json({ success: false, error: 'Invalid student ID' }, { status: 400 });
    }

    // ✅ Find student first
    const student = await prisma.student.findUnique({ where: { id } });

    if (!student) {
      console.log('❌ Student not found:', id);
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    console.log('📋 Deleting student:', student.name, student.rollNo);

    // ✅ Deactivate linked user (only if userId is a valid ObjectId)
    if (student.userId && /^[a-fA-F0-9]{24}$/.test(student.userId)) {
      try {
        await prisma.user.update({
          where: { id: student.userId },
          data: { isActive: false },
        });
        console.log('✅ User deactivated:', student.userId);
      } catch (userErr) {
        // Don't let user deactivation failure prevent student deletion
        console.warn('⚠️ User deactivation failed (continuing with delete):', userErr.message);
      }
    } else {
      console.log('ℹ️ No valid userId to deactivate:', student.userId);
    }

    // ✅ Delete attendance records for this student
    try {
      await prisma.attendance.deleteMany({
        where: { entityId: id, entityType: 'student' },
      });
      console.log('✅ Attendance records deleted');
    } catch (attErr) {
      console.warn('⚠️ Attendance cleanup failed:', attErr.message);
    }

    // ✅ Actually delete the student
    await prisma.student.delete({ where: { id } });

    console.log('✅ Student deleted successfully:', id);

    return NextResponse.json({
      success: true,
      message: `Student ${student.name} deleted successfully`,
    });
  } catch (err) {
    console.error('❌ DELETE /api/students/[id] error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to delete student',
    }, { status: 500 });
  }
}