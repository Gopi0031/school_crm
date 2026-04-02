import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch       = searchParams.get('branch');
    const cls          = searchParams.get('class');
    const section      = searchParams.get('section');
    const status       = searchParams.get('status');
    const search       = searchParams.get('search');
    const academicYear = searchParams.get('academicYear');
    const branchId     = searchParams.get('branchId');

    // ✅ Build where clause properly
    const where = {};

    if (branch) {
      where.branch = branch;
    }

    if (cls) {
      where.class = { equals: cls, mode: 'insensitive' };
    }

    if (section) {
      where.section = { equals: section, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (academicYear) {
      where.academicYear = academicYear;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (search) {
      where.OR = [
        { name:       { contains: search, mode: 'insensitive' } },
        { rollNo:     { contains: search, mode: 'insensitive' } },
        { email:      { contains: search, mode: 'insensitive' } },
        { phone:      { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('📋 GET /api/students - where:', JSON.stringify(where));

    const students = await prisma.student.findMany({
      where,
      orderBy: { rollNo: 'asc' },
    });

    // ✅ Normalize fee values to proper integers
    const normalizedStudents = students.map(s => ({
      ...s,
      totalFee:  Math.round(Number(s.totalFee)  || 0),
      paidFee:   Math.round(Number(s.paidFee)   || 0),
      term1:     Math.round(Number(s.term1)     || 0),
      term2:     Math.round(Number(s.term2)     || 0),
      term3:     Math.round(Number(s.term3)     || 0),
      term1Due:  Math.round(Number(s.term1Due)  || 0),
      term2Due:  Math.round(Number(s.term2Due)  || 0),
      term3Due:  Math.round(Number(s.term3Due)  || 0),
    }));

    console.log('📋 Found', normalizedStudents.length, 'students');

    return NextResponse.json({ success: true, data: normalizedStudents });
  } catch (err) {
    console.error('❌ GET students error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name, rollNo, class: cls, section, gender, bloodGroup, caste,
      aadhaar, address, parentName, phone, email, branch, branchId,
      academicYear, yearOfJoining, dateOfJoining, totalFee,
      username, password,
    } = body;

    console.log('📝 Creating student:', { name, rollNo, username, branch });

    // ═══════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════
    if (!name || !rollNo || !cls || !section) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, Roll No, Class and Section are required' 
      }, { status: 400 });
    }

    // Check duplicate rollNo in same branch
    const existingStudent = await prisma.student.findFirst({ 
      where: { 
        rollNo: { equals: rollNo, mode: 'insensitive' },
        branch: branch || ''
      } 
    });
    
    if (existingStudent) {
      return NextResponse.json({ 
        success: false, 
        error: `Roll number ${rollNo} already exists in ${branch}` 
      }, { status: 400 });
    }

    const finalUsername = username?.toLowerCase().trim() || '';

    // Check username availability BEFORE creating anything
    if (finalUsername && password) {
      const existingUser = await prisma.user.findUnique({ 
        where: { username: finalUsername } 
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: `Username "${finalUsername}" is already taken` 
        }, { status: 400 });
      }
    }

    // ═══════════════════════════════════════════════════════
    // CALCULATE FEES (with proper rounding)
    // ═══════════════════════════════════════════════════════
    const totalFeeNum = Math.round(Number(totalFee) || 0);  // ✅ Round to integer
    
    // Calculate term dues with proper integer math
    let term1Due = 0;
    let term2Due = 0;
    let term3Due = 0;
    
    if (totalFeeNum > 0) {
      const base = Math.floor(totalFeeNum / 3);
      const remainder = totalFeeNum - (base * 3);
      
      // Distribute remainder to term1
      term1Due = base + remainder;
      term2Due = base;
      term3Due = base;
      
      // Verify sum equals total
      console.log('📊 Fee split:', { 
        total: totalFeeNum, 
        term1Due, term2Due, term3Due, 
        sum: term1Due + term2Due + term3Due 
      });
    }

    // ═══════════════════════════════════════════════════════
    // CREATE STUDENT
    // ═══════════════════════════════════════════════════════
    const student = await prisma.student.create({
      data: {
        name, 
        rollNo, 
        class: cls, 
        section,
        gender:        gender        || '', 
        bloodGroup:    bloodGroup    || '',
        caste:         caste         || '', 
        aadhaar:       aadhaar       || '',
        address:       address       || '', 
        parentName:    parentName    || '',
        phone:         phone         || '', 
        email:         email         || '',
        branch:        branch        || '', 
        branchId:      branchId      || '',
        academicYear:  academicYear  || '2025-26',
        yearOfJoining: yearOfJoining || '',
        dateOfJoining: dateOfJoining || new Date().toISOString().split('T')[0],
        totalFee:      totalFeeNum,        // ✅ Rounded integer
        username:      finalUsername,
        userId:        '',
        status:        'Active',
        paidFee:       0,
        term1:         0, 
        term2:         0, 
        term3:         0,
        term1Due,                          // ✅ Proper integer
        term2Due,                          // ✅ Proper integer
        term3Due,                          // ✅ Proper integer
        presentDays:      0,
        absentDays:       0,
        totalWorkingDays: 0,
        todayAttendance:  '',
      },
    });

    console.log('✅ Student created:', student.id, student.name, 'Fee:', student.totalFee);

    // ═══════════════════════════════════════════════════════
    // CREATE USER (if credentials provided)
    // ═══════════════════════════════════════════════════════
    let userId = null;

    if (finalUsername && password) {
      const hashed = await bcrypt.hash(password, 10);
      
      const userRecord = await prisma.user.create({
        data: {
          username:  finalUsername, 
          password:  hashed, 
          role:      'student',
          name, 
          email:     email    || '', 
          phone:     phone    || '',
          branch:    branch   || '', 
          branchId:  branchId || '',
          class:     cls, 
          section, 
          rollNo,
          studentId: student.id,
          isActive:  true,
        },
      });
      
      userId = userRecord.id;
      console.log('✅ User created:', userRecord.id, 'studentId:', userRecord.studentId);

      // Update student with userId
      await prisma.student.update({
        where: { id: student.id },
        data: { userId: userRecord.id }
      });
      
      console.log('✅ Student updated with userId:', userRecord.id);
    }

    // Fetch updated student
    const updatedStudent = await prisma.student.findUnique({
      where: { id: student.id }
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...updatedStudent,
        // ✅ Ensure response has proper integers
        totalFee:  Math.round(Number(updatedStudent.totalFee)  || 0),
        paidFee:   Math.round(Number(updatedStudent.paidFee)   || 0),
        term1Due:  Math.round(Number(updatedStudent.term1Due)  || 0),
        term2Due:  Math.round(Number(updatedStudent.term2Due)  || 0),
        term3Due:  Math.round(Number(updatedStudent.term3Due)  || 0),
      }
    }, { status: 201 });
    
  } catch (err) {
    console.error('❌ POST student error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to create student' 
    }, { status: 500 });
  }
}