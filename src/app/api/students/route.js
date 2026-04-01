import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch      = searchParams.get('branch');
    const cls         = searchParams.get('class');
    const section     = searchParams.get('section');
    const status      = searchParams.get('status');
    const search      = searchParams.get('search');
    const academicYear = searchParams.get('academicYear');
    const branchId    = searchParams.get('branchId');

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
      // ✅ Removed include - username is stored directly on student
      orderBy: { rollNo: 'asc' },
    });

    return NextResponse.json({ success: true, data: students });
  } catch (err) {
    console.error('GET students error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
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

    if (!name || !rollNo || !cls || !section)
      return NextResponse.json({ error: 'Name, Roll No, Class and Section are required' }, { status: 400 });

    const existing = await prisma.student.findFirst({ where: { rollNo, branch } });
    if (existing) return NextResponse.json({ error: 'Roll number already exists' }, { status: 400 });

    let userId = null;
    let finalUsername = username?.toLowerCase().trim() || '';

    if (finalUsername && password) {
      const existingUser = await prisma.user.findUnique({ where: { username: finalUsername } });
      if (existingUser) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });

      const hashed = await bcrypt.hash(password, 10);
      const userRecord = await prisma.user.create({
        data: {
          username: finalUsername, password: hashed, role: 'student',
          name, email: email || '', phone: phone || '',
          branch: branch || '', branchId: branchId || '',
          class: cls, section, rollNo, isActive: true,
        },
      });
      userId = userRecord.id;
    }

    // ✅ Auto-split totalFee into 3 terms on create
    const totalFeeNum = Number(totalFee) || 0;
    const base  = totalFeeNum > 0 ? Math.floor(totalFeeNum / 3) : 0;
    const extra = totalFeeNum > 0 ? totalFeeNum - base * 3 : 0;

    const student = await prisma.student.create({
      data: {
        name, rollNo, class: cls, section,
        gender: gender || '', bloodGroup: bloodGroup || '',
        caste: caste || '', aadhaar: aadhaar || '',
        address: address || '', parentName: parentName || '',
        phone: phone || '', email: email || '',
        branch: branch || '', branchId: branchId || '',
        academicYear: academicYear || '2025-26',
        yearOfJoining: yearOfJoining || '',
        dateOfJoining: dateOfJoining || '',
        totalFee: totalFeeNum,
        username: finalUsername,
        userId,
        status: 'Active',
        paidFee: 0,
        term1: 0, term2: 0, term3: 0,
        term1Due: base + extra,   // e.g. ₹35000 → 11667
        term2Due: base,           // → 11667
        term3Due: base,           // → 11666
      },
    });

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (err) {
    console.error('POST student error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
