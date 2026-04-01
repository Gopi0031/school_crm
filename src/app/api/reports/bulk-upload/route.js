import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';

function normalize(key) {
  return key?.toString().toLowerCase().trim().replace(/[\s_-]/g, '');
}

function mapRow(rawRow) {
  const aliases = {
    rollno: ['rollno', 'rollnumber', 'roll', 'rno', 'studentroll'],
    subject: ['subject', 'sub', 'subjectname'],
    marksobtained: ['marks', 'marksobtained', 'marksscored', 'obtained', 'score'],
    totalmarks: ['totalmarks', 'total', 'outof', 'maximum', 'maxmarks'],
    exam: ['exam', 'examtype', 'examname', 'type', 'test'],
    academicyear: ['academicyear', 'year', 'session', 'ay', 'academicsession'],
  };

  const result = {};
  const rawKeys = Object.keys(rawRow);

  for (const [field, aliasList] of Object.entries(aliases)) {
    const key = rawKeys.find((k) => aliasList.includes(normalize(k)));
    if (key) {
      result[field] = rawRow[key]?.toString().trim() || '';
    }
  }

  return result;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const branch = formData.get('branch') || '';
    const defaultExam = formData.get('exam') || 'Annual';
    const defaultYear = formData.get('academicYear') || '2024-25';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rawRows.length) {
      return NextResponse.json(
        { success: false, message: 'File is empty or has no valid data' },
        { status: 400 }
      );
    }

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = mapRow(rawRows[i]);
      const rowNum = i + 2; // Excel row number (header = 1)

      // Validation
      if (!row.rollno || !row.subject || !row.marksobtained) {
        errors.push({
          row: rowNum,
          reason: 'Missing required fields (rollno, subject, marks)',
        });
        skipped++;
        continue;
      }

      // Find student
      const student = await prisma.student.findFirst({
        where: { rollNo: row.rollno, branch },
        select: { id: true, name: true, rollNo: true, class: true, section: true, branch: true },
      });

      if (!student) {
        errors.push({
          row: rowNum,
          reason: `Student with Roll No "${row.rollno}" not found in branch "${branch}"`,
        });
        skipped++;
        continue;
      }

      // Calculate marks
      const marksObtained = Number(row.marksobtained) || 0;
      const totalMarks = Number(row.totalmarks) || 100;
      const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
      const exam = row.exam || defaultExam;
      const academicYear = row.academicyear || defaultYear;

      try {
        await prisma.report.upsert({
          where: {
            studentId_subject_exam: {
              studentId: student.id,
              subject: row.subject,
              exam,
            },
          },
          update: {
            marksObtained,
            totalMarks,
            percentage,
            status: percentage >= 35 ? 'Pass' : 'Fail',
            academicYear,
            updatedAt: new Date(),
          },
          create: {
            studentId: student.id,
            studentName: student.name,
            rollNo: student.rollNo,
            class: student.class,
            section: student.section,
            branch: student.branch,
            subject: row.subject,
            marksObtained,
            totalMarks,
            percentage,
            status: percentage >= 35 ? 'Pass' : 'Fail',
            exam,
            academicYear,
          },
        });
        inserted++;
      } catch (dbErr) {
        errors.push({
          row: rowNum,
          reason: `Database error: ${dbErr.message}`,
        });
        skipped++;
      }
    }

    return NextResponse.json({
      success: inserted > 0,
      message: `${inserted} report(s) uploaded successfully, ${skipped} skipped`,
      inserted,
      skipped,
      errors: errors.slice(0, 10), // Return first 10 errors only
    });
  } catch (err) {
    console.error('[POST /api/reports/bulk-upload]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}