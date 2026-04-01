import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch  = searchParams.get('branch')  || '';
    const cls     = searchParams.get('class')   || '';
    const subject = searchParams.get('subject') || '';

    if (subject) {
      const data = await prisma.syllabus.findFirst({
        where: { branch, class: cls, subject },
      });
      return NextResponse.json({ success: true, data: data || null });
    }

    const data = await prisma.syllabus.findMany({
      where: { branch, class: cls },
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/syllabus]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { branch, class: cls, subject, units, updatedBy } = body;

    const syl = await prisma.syllabus.upsert({
      where:  { branch_class_subject: { branch, class: cls, subject } },
      update: { units, updatedBy: updatedBy || '' },
      create: { branch, class: cls, subject, units, updatedBy: updatedBy || '' },
    });

    return NextResponse.json({ success: true, data: syl });
  } catch (err) {
    console.error('[POST /api/syllabus]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
