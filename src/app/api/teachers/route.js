import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function generateEmployeeId(name) {
  const prefix = name.replace(/\s+/g, '').toUpperCase().slice(0, 3) || 'TCH';
  return `${prefix}${Date.now().toString().slice(-4)}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch  = searchParams.get('branch')  || '';
    const cls     = searchParams.get('class')   || '';
    const section = searchParams.get('section') || '';

    const teachers = await prisma.teacher.findMany({
      where: {
        ...(branch  && { branch:  { equals: branch,  mode: 'insensitive' } }),
        ...(cls     && { class:   cls }),
        ...(section && { section: section }),
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: teachers });
  } catch (err) {
    console.error('[GET /api/teachers]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      username, password,
      confirmPassword,     // ✅ strip — frontend only
      _usernameTouched,    // ✅ strip — frontend only
      branch, branchId,
      classTeacher, assignedClass,
      ...rest
    } = body;

    if (!rest.name)  return NextResponse.json({ error: 'Name is required' },     { status: 400 });
    if (!username)   return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    if (!password)   return NextResponse.json({ error: 'Password is required' }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (exists) return NextResponse.json({ error: `Username "${username}" already taken` }, { status: 400 });

    if (classTeacher && assignedClass && rest.section) {
      const conflict = await prisma.teacher.findFirst({
        where: { assignedClass, section: rest.section, classTeacher: true, branch },
      });
      if (conflict) return NextResponse.json({
        error: `${assignedClass}-${rest.section} already has a class teacher: ${conflict.name}`
      }, { status: 400 });
    }

    const employeeId = generateEmployeeId(rest.name);
    const hashedPwd  = await bcrypt.hash(password, 10);

    const teacher = await prisma.teacher.create({
      data: {
        ...rest,
        branch:        branch || '',
        branchId:      branchId || '',
        employeeId,
        username:      username.toLowerCase(),
        classTeacher:  classTeacher || false,
        assignedClass: classTeacher ? (assignedClass || '') : '',
        status:        rest.status || 'Active',
        salary:        Number(rest.salary) || 0,
      },
    });

    const user = await prisma.user.create({
      data: {
        username:   username.toLowerCase(),
        password:   hashedPwd,
        role:       'teacher',
        name:       rest.name,
        email:      rest.email || '',
        branch:     branch || '',
        branchId:   branchId || '',
        teacherId:  teacher.id,
        employeeId,
        isActive:   true,
      },
    });

    await prisma.teacher.update({
      where: { id: teacher.id },
      data:  { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      data:    { employeeId, username: username.toLowerCase() },
      message: `Teacher created successfully${classTeacher ? ' and assigned as class teacher' : ''}`,
    });
  } catch (err) {
    console.error('[POST /api/teachers]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
