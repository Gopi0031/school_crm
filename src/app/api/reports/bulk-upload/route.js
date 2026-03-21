import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import connectDB from '@/lib/mongodb';
import Report from '@/models/Report';
import Student from '@/models/Student';

function normalize(key) {
  return key?.toString().toLowerCase().trim().replace(/[\s_]/g, '');
}

function mapRow(rawRow) {
  const map = {
    rollno:        ['rollno','rollnumber','roll','rollno'],
    subject:       ['subject','sub'],
    marksobtained: ['marks','marksobtained','marksscored','obtained'],
    totalmarks:    ['totalmarks','total','outof','maximum'],
    exam:          ['exam','examtype','examname','type'],
    academicyear:  ['academicyear','year','session','ay'],
  };
  const result = {};
  const rawKeys = Object.keys(rawRow);
  for (const [field, aliases] of Object.entries(map)) {
    const key = rawKeys.find(k => aliases.includes(normalize(k)));
    if (key) result[field] = rawRow[key]?.toString().trim() || '';
  }
  return result;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file     = formData.get('file');
    const branch   = formData.get('branch') || '';
    const defaultExam  = formData.get('exam')         || 'Annual';
    const defaultYear  = formData.get('academicYear') || '2024-25';

    if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });

    const buffer   = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rawRows  = XLSX.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
      { defval: '' }
    );

    if (!rawRows.length) return NextResponse.json({ success: false, message: 'File is empty' }, { status: 400 });

    await connectDB();

    let inserted = 0, skipped = 0;
    const errors = [];
    const ops    = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row    = mapRow(rawRows[i]);
      const rowNum = i + 2;

      if (!row.rollno || !row.subject || !row.marksobtained) {
        errors.push({ row: rowNum, reason: `Missing rollno, subject or marks` });
        skipped++; continue;
      }

      // Find student by rollNo + branch
      const student = await Student.findOne({ rollNo: row.rollno, branch });
      if (!student) {
        errors.push({ row: rowNum, reason: `Student with Roll No "${row.rollno}" not found` });
        skipped++; continue;
      }

      const marksObtained = Number(row.marksobtained) || 0;
      const totalMarks    = Number(row.totalmarks)    || 100;
      const percentage    = totalMarks ? Math.round(marksObtained / totalMarks * 100) : 0;
      const examType      = row.exam         || defaultExam;
      const academicYear  = row.academicyear || defaultYear;

      ops.push({
        updateOne: {
          filter: {
            studentId: student._id,
            subject:   row.subject,
            exam:      examType,
            academicYear,
          },
          update: {
            $set: {
              studentId:    student._id,
              studentName:  student.name,
              rollNo:       student.rollNo,
              class:        student.class,
              section:      student.section,
              branch,
              subject:      row.subject,
              marksObtained,
              totalMarks,
              percentage,
              status:       percentage >= 35 ? 'Pass' : 'Fail',
              exam:         examType,
              academicYear,
            },
          },
          upsert: true,
        },
      });
      inserted++;
    }

    if (ops.length) await Report.bulkWrite(ops);

    return NextResponse.json({
      success:  inserted > 0,
      message:  `${inserted} report(s) saved, ${skipped} skipped.`,
      inserted, skipped, errors,
    });

  } catch (err) {
    console.error('[bulk-upload/reports]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
