import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch     = searchParams.get('branch')     || '';
    const department = searchParams.get('department') || '';
    const status     = searchParams.get('status')     || '';
    const search     = searchParams.get('search')     || '';
    const branchId   = searchParams.get('branchId')   || '';

    const staff = await prisma.staff.findMany({
      where: {
        ...(branch     && { branch }),
        ...(branchId   && { branchId }),
        ...(department && { department }),
        ...(status     && { status }),
        ...(search     && {
          OR: [
            { name:        { contains: search, mode: 'insensitive' } },
            { employeeId:  { contains: search, mode: 'insensitive' } },
            { designation: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: staff });
  } catch (err) {
    console.error('[GET /api/staff]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name, phone, email, department, designation,
      qualification, experience, joinYear, salary,
      branch, branchId, aadhaar, pan, status,
    } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const count      = await prisma.staff.count({ where: { branch } });
    const employeeId = `STF-${branch?.substring(0, 3).toUpperCase() || 'SCH'}-${String(count + 1).padStart(4, '0')}`;

    const staff = await prisma.staff.create({
      data: {
        name,
        phone:         phone         || '',
        email:         email         || '',
        department:    department    || '',
        designation:   designation   || '',
        qualification: qualification || '',
        experience:    experience    || '',
        joinYear:      joinYear      || '',
        salary:        Number(salary) || 0,
        branch:        branch        || '',
        branchId:      branchId      || '',
        aadhaar:       aadhaar       || '',
        pan:           pan           || '',
        employeeId,
        status:        status || 'Active',
      },
    });

    return NextResponse.json({ success: true, data: staff }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/staff]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
