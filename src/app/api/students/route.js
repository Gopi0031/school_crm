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

    const students = await prisma.student.findMany({
      where: {
        ...(branch       && { branch }),
        ...(cls          && { class: { equals: cls, mode: 'insensitive' } }),
        ...(section      && { section: { equals: section, mode: 'insensitive' } }),
        ...(status       && { status }),
        ...(academicYear && { academicYear }),
        ...(branchId     && { branchId }),
        ...(search && {
          OR: [
            { name:       { contains: search, mode: 'insensitive' } },
            { rollNo:     { contains: search, mode: 'insensitive' } },
            { email:      { contains: search, mode: 'insensitive' } },
            { phone:      { contains: search, mode: 'insensitive' } },
            { parentName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { rollNo: 'asc' },
    });

    return NextResponse.json({ success: true, data: students });
  } catch (err) {
    console.error('GET students error:', err);
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

    // Validation
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

    // Calculate term dues
    const totalFeeNum = Number(totalFee) || 0;
    const base  = totalFeeNum > 0 ? Math.floor(totalFeeNum / 3) : 0;
    const extra = totalFeeNum > 0 ? totalFeeNum - base * 3 : 0;

    // Create Student FIRST
    const student = await prisma.student.create({
      data: {
        name, 
        rollNo, 
        class: cls, 
        section,
        gender: gender || '', 
        bloodGroup: bloodGroup || '',
        caste: caste || '', 
        aadhaar: aadhaar || '',
        address: address || '', 
        parentName: parentName || '',
        phone: phone || '', 
        email: email || '',
        branch: branch || '', 
        branchId: branchId || '',
        academicYear: academicYear || '2025-26',
        yearOfJoining: yearOfJoining || '',
        dateOfJoining: dateOfJoining || new Date().toISOString().split('T')[0],
        totalFee: totalFeeNum,
        username: finalUsername,  // ✅ Store username
        userId: '',               // Will update after creating user
        status: 'Active',
        paidFee: 0,
        term1: 0, 
        term2: 0, 
        term3: 0,
        term1Due: base + extra,
        term2Due: base,
        term3Due: base,
      },
    });

    console.log('✅ Student created:', student.id, student.name);

    let userId = null;

    // Create User if credentials provided
    if (finalUsername && password) {
      const hashed = await bcrypt.hash(password, 10);
      
      const userRecord = await prisma.user.create({
        data: {
          username: finalUsername, 
          password: hashed, 
          role: 'student',
          name, 
          email: email || '', 
          phone: phone || '',
          branch: branch || '', 
          branchId: branchId || '',
          class: cls, 
          section, 
          rollNo,
          studentId: student.id,  // ✅ Link to student
          isActive: true,
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
      data: updatedStudent 
    }, { status: 201 });
    
  } catch (err) {
    console.error('❌ POST student error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to create student' 
    }, { status: 500 });
  }
}