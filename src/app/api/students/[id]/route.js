import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// ═══════════════════════════════════════════════════════════════════════════
// GET - Fetch single student by ID
// ═══════════════════════════════════════════════════════════════════════════
export async function GET(req, context) {
  try {
    const { id } = await context.params;

    console.log('📋 GET /api/students/[id]', { id });

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required',
        data: null 
      }, { status: 400 });
    }

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

    const totalFee = Math.round(Number(student.totalFee) || 0);
    const term1    = Math.round(Number(student.term1)    || 0);
    const term2    = Math.round(Number(student.term2)    || 0);
    const term3    = Math.round(Number(student.term3)    || 0);
    const paidFee  = term1 + term2 + term3;

    let term1Due = Math.round(Number(student.term1Due) || 0);
    let term2Due = Math.round(Number(student.term2Due) || 0);
    let term3Due = Math.round(Number(student.term3Due) || 0);

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
export async function PUT(req, context) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    console.log('📝 PUT /api/students/[id]', { id, fields: Object.keys(body) });

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required' 
      }, { status: 400 });
    }

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

    const { password, confirmPassword, ...updateFields } = body;
    const processedData = { ...updateFields };

    if (updateFields.totalFee !== undefined) {
      processedData.totalFee = Math.round(Number(updateFields.totalFee) || 0);
      
      if (processedData.totalFee > 0) {
        const total = processedData.totalFee;
        const base = Math.floor(total / 3);
        const remainder = total - (base * 3);
        
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

    const feeFields = ['paidFee', 'term1', 'term2', 'term3', 'term1Due', 'term2Due', 'term3Due'];
    feeFields.forEach(field => {
      if (processedData[field] !== undefined) {
        processedData[field] = Math.round(Number(processedData[field]) || 0);
      }
    });

    const intFields = ['presentDays', 'absentDays', 'totalWorkingDays'];
    intFields.forEach(field => {
      if (processedData[field] !== undefined) {
        processedData[field] = Math.round(Number(processedData[field]) || 0);
      }
    });

    const updated = await prisma.student.update({
      where: { id },
      data: processedData,
    });

    console.log('✅ Student updated:', updated.name);

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
      }
    }

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
// PATCH - Partial update student
// ═══════════════════════════════════════════════════════════════════════════
export async function PATCH(req, context) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    console.log('📝 PATCH /api/students/[id]', { id, fields: Object.keys(body) });

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required',
        data: null 
      }, { status: 400 });
    }

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

    const updateData = {};
    
    const feeFields = ['totalFee', 'paidFee', 'term1', 'term2', 'term3', 'term1Due', 'term2Due', 'term3Due'];
    feeFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = Math.round(Number(body[field]) || 0);
      }
    });

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

    const intFields = ['presentDays', 'absentDays', 'totalWorkingDays'];
    intFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = Math.round(Number(body[field]) || 0);
      }
    });

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Student PATCH updated:', updated.name);

    return NextResponse.json({ 
      success: true, 
      data: {
        ...updated,
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
export async function DELETE(req, context) {
  try {
    const { id } = await context.params;

    console.log('🗑️ DELETE /api/students/[id]', { id });

    // Validate ID
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid student ID is required' 
      }, { status: 400 });
    }

    // Find student
    const student = await prisma.student.findUnique({ 
      where: { id } 
    });

    if (!student) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found' 
      }, { status: 404 });
    }

    console.log('📋 Student to delete:', {
      id: student.id,
      name: student.name,
      rollNo: student.rollNo,
      username: student.username,
      userId: student.userId
    });

    let deletedUserIds = [];

    // ═══════════════════════════════════════════════════════
    // STRATEGY 1: Delete by userId (primary)
    // ═══════════════════════════════════════════════════════
    if (student.userId && /^[a-fA-F0-9]{24}$/.test(student.userId)) {
      try {
        await prisma.user.delete({ where: { id: student.userId } });
        deletedUserIds.push(student.userId);
        console.log('✅ Deleted user by userId:', student.userId);
      } catch (err) {
        console.warn('⚠️ Delete by userId failed:', err.code, err.message);
      }
    }

    // ═══════════════════════════════════════════════════════
    // STRATEGY 2: Delete by username (fallback)
    // ═══════════════════════════════════════════════════════
    if (student.username && student.username.trim()) {
      try {
        const username = student.username.toLowerCase().trim();
        const userByUsername = await prisma.user.findUnique({ 
          where: { username } 
        });
        
        if (userByUsername && !deletedUserIds.includes(userByUsername.id)) {
          await prisma.user.delete({ where: { id: userByUsername.id } });
          deletedUserIds.push(userByUsername.id);
          console.log('✅ Deleted user by username:', username);
        }
      } catch (err) {
        console.warn('⚠️ Delete by username failed:', err.code, err.message);
      }
    }

    // ═══════════════════════════════════════════════════════
    // STRATEGY 3: Delete by studentId reference (backup)
    // ═══════════════════════════════════════════════════════
    try {
      const usersWithStudentId = await prisma.user.findMany({ 
        where: { 
          studentId: student.id,
          role: 'student'
        } 
      });
      
      for (const user of usersWithStudentId) {
        if (!deletedUserIds.includes(user.id)) {
          await prisma.user.delete({ where: { id: user.id } });
          deletedUserIds.push(user.id);
          console.log('✅ Deleted user by studentId reference:', user.id);
        }
      }
    } catch (err) {
      console.warn('⚠️ Delete by studentId failed:', err.message);
    }

    // ═══════════════════════════════════════════════════════
    // STRATEGY 4: Delete by rollNo + branch (final fallback)
    // ═══════════════════════════════════════════════════════
    if (student.rollNo && student.branch) {
      try {
        const usersWithRollNo = await prisma.user.findMany({ 
          where: { 
            rollNo: { equals: student.rollNo, mode: 'insensitive' },
            branch: student.branch,
            role: 'student'
          } 
        });
        
        for (const user of usersWithRollNo) {
          if (!deletedUserIds.includes(user.id)) {
            await prisma.user.delete({ where: { id: user.id } });
            deletedUserIds.push(user.id);
            console.log('✅ Deleted user by rollNo+branch:', user.id);
          }
        }
      } catch (err) {
        console.warn('⚠️ Delete by rollNo failed:', err.message);
      }
    }

    console.log(`🗑️ Total users deleted: ${deletedUserIds.length}`, deletedUserIds);

    // ═══════════════════════════════════════════════════════
    // Delete related records (cascade)
    // ═══════════════════════════════════════════════════════
    const cleanupResults = {
      attendance: 0,
      reports: 0,
      feePayments: 0,
      feeNotifications: 0,
      promotionHistory: 0,
    };

    try {
      const deleted = await prisma.attendance.deleteMany({
        where: { entityId: id, entityType: 'student' }
      });
      cleanupResults.attendance = deleted.count;
    } catch (err) {
      console.warn('⚠️ Attendance cleanup failed:', err.message);
    }

    try {
      const deleted = await prisma.report.deleteMany({
        where: { studentId: id }
      });
      cleanupResults.reports = deleted.count;
    } catch (err) {
      console.warn('⚠️ Reports cleanup failed:', err.message);
    }

    try {
      const deleted = await prisma.feePayment.deleteMany({
        where: { studentId: id }
      });
      cleanupResults.feePayments = deleted.count;
    } catch (err) {
      console.warn('⚠️ Fee payments cleanup failed:', err.message);
    }

    try {
      const deleted = await prisma.feeNotification.deleteMany({
        where: { studentId: id }
      });
      cleanupResults.feeNotifications = deleted.count;
    } catch (err) {
      console.warn('⚠️ Fee notifications cleanup failed:', err.message);
    }

    try {
      const deleted = await prisma.promotionHistory.deleteMany({
        where: { studentId: id }
      });
      cleanupResults.promotionHistory = deleted.count;
    } catch (err) {
      console.warn('⚠️ Promotion history cleanup failed:', err.message);
    }

    console.log('🗑️ Cleanup results:', cleanupResults);

    // ═══════════════════════════════════════════════════════
    // Finally, delete the student
    // ═══════════════════════════════════════════════════════
    await prisma.student.delete({ where: { id } });

    console.log('✅ Student deleted successfully:', student.name);

    return NextResponse.json({
      success: true,
      message: `Student ${student.name} (${student.rollNo}) and ${deletedUserIds.length} associated user(s) deleted successfully`,
      deletedRecords: {
        student: 1,
        users: deletedUserIds.length,
        ...cleanupResults
      }
    });

  } catch (err) {
    console.error('❌ DELETE error:', err);
    
    let errorMessage = 'Failed to delete student';
    
    if (err.code === 'P2025') {
      errorMessage = 'Student not found or already deleted';
    } else if (err.code === 'P2003') {
      errorMessage = 'Cannot delete: student has protected related records';
    } else if (err.message) {
      errorMessage = err.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: err.code || 'UNKNOWN_ERROR'
    }, { status: 500 });
  }
}