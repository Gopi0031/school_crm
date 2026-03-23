import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Syllabus from '@/models/Syllabus';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branch  = searchParams.get('branch');
    const cls     = searchParams.get('class');
    const subject = searchParams.get('subject');

    // If no subject — return all subjects for that class (for student overview)
    const query = { branch, class: cls };
    if (subject) query.subject = subject;

    const data = subject
      ? await Syllabus.findOne(query)
      : await Syllabus.find({ branch, class: cls });

    return NextResponse.json({ success: true, data: data || (subject ? null : []) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { branch, class: cls, subject, units, updatedBy } = body;

    const syl = await Syllabus.findOneAndUpdate(
      { branch, class: cls, subject },
      { units, updatedBy, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, data: syl });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
