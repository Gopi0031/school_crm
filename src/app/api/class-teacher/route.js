import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch') || '';

    const teachers = await prisma.teacher.findMany({
      where: { branch: { equals: branch, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
    });

    // ✅ Normalize id → _id for frontend compatibility
    const data = teachers.map(t => ({ ...t, _id: t.id }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/class-teacher]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { teacherId, assignedClass, section } = await req.json();
    if (!teacherId || !assignedClass || !section)
      return NextResponse.json({ error: 'teacherId, assignedClass and section required' }, { status: 400 });

    // Check conflict
    const conflict = await prisma.teacher.findFirst({
      where: { assignedClass, section, classTeacher: true, id: { not: teacherId } },
    });
    if (conflict)
      return NextResponse.json({
        error: `${assignedClass}-${section} already has class teacher: ${conflict.name}`
      }, { status: 400 });

    const teacher = await prisma.teacher.update({
      where: { id: teacherId },
      data:  { classTeacher: true, assignedClass, section },
    });

    // ✅ Also update linked User record so teacher login shows correct class/section
    if (teacher.userId) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data:  { class: assignedClass, section },
      });
    }

    return NextResponse.json({ success: true, data: { ...teacher, _id: teacher.id } });
  } catch (err) {
    console.error('[POST /api/class-teacher]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { teacherId, assignedClass, section } = await req.json();
    if (!teacherId || !assignedClass || !section)
      return NextResponse.json({ error: 'teacherId, assignedClass and section required' }, { status: 400 });

    // Check conflict — exclude current teacher
    const conflict = await prisma.teacher.findFirst({
      where: { assignedClass, section, classTeacher: true, id: { not: teacherId } },
    });
    if (conflict)
      return NextResponse.json({
        error: `${assignedClass}-${section} already has class teacher: ${conflict.name}`
      }, { status: 400 });

    const teacher = await prisma.teacher.update({
      where: { id: teacherId },
      data:  { assignedClass, section },
    });

    if (teacher.userId) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data:  { class: assignedClass, section },
      });
    }

    return NextResponse.json({ success: true, data: { ...teacher, _id: teacher.id } });
  } catch (err) {
    console.error('[PUT /api/class-teacher]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');
    if (!teacherId)
      return NextResponse.json({ error: 'teacherId required' }, { status: 400 });

    const teacher = await prisma.teacher.update({
      where: { id: teacherId },
      data:  { classTeacher: false, assignedClass: '' },
    });

    if (teacher.userId) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data:  { class: '', section: '' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/class-teacher]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
