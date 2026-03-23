import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch  = searchParams.get('branch');
    const cls     = searchParams.get('class');
    const section = searchParams.get('section');

    if (!branch || !cls || !section)
      return NextResponse.json({ error: 'branch, class, section required' }, { status: 400 });

    const tt = await prisma.timetable.findFirst({
      where: { branch, class: cls, section },
    });
    return NextResponse.json({ success: true, data: tt || null });
  } catch (err) {
    console.error('[GET /api/timetable]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { branch, class: cls, section, days, updatedBy } = body;

    console.log('[POST /api/timetable] branch:', branch, '| class:', cls, '| section:', section);

    if (!branch || !cls || !section)
      return NextResponse.json({ success: false, message: 'branch, class, section are required' }, { status: 400 });

    const tt = await prisma.timetable.upsert({
      where:  { branch_class_section: { branch, class: cls, section } },
      update: { days: days ?? [], updatedBy: updatedBy || '' },
      create: { branch, class: cls, section, days: days ?? [], updatedBy: updatedBy || '' },
    });

    console.log('[POST /api/timetable] saved id:', tt.id);
    return NextResponse.json({ success: true, data: tt });
  } catch (err) {
    console.error('[POST /api/timetable]', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
