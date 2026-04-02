import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const NEXT_CLASS = {
  'Class 1':  'Class 2', 'Class 2':  'Class 3', 'Class 3':  'Class 4',
  'Class 4':  'Class 5', 'Class 5':  'Class 6', 'Class 6':  'Class 7',
  'Class 7':  'Class 8', 'Class 8':  'Class 9', 'Class 9':  'Class 10',
  'Class 10': 'Class 11', 'Class 11': 'Class 12', 'Class 12': null,
};

function getNextAcademicYear(current) {
  const match = current?.match(/^(\d{4})-(\d{2,4})$/);
  if (!match) {
    const year = new Date().getFullYear();
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  const startYear = parseInt(match[1]) + 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

// GET Preview
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const currentYear = searchParams.get('academicYear');

    if (!currentYear) {
      return NextResponse.json({ success: false, error: 'academicYear required' }, { status: 400 });
    }

    const where = { academicYear: currentYear, status: 'Active' };
    if (branch) where.branch = branch;

    const students = await prisma.student.findMany({ where });
    const nextYear = getNextAcademicYear(currentYear);

    const feeStructures = await prisma.feeStructure.findMany({
      where: { academicYear: nextYear, ...(branch && { branch }), isActive: true },
    });

    const preview = students.map(s => {
      const nextClass = NEXT_CLASS[s.class] || null;
      const feeStructure = feeStructures.find(f => f.class === nextClass);
      
      return {
        id: s.id, name: s.name, rollNo: s.rollNo, branch: s.branch,
        currentClass: s.class, section: s.section, nextClass,
        willGraduate: !nextClass,
        status: nextClass ? 'Active' : 'Passed Out',
        currentYear, nextYear,
        currentFee: Number(s.totalFee) || 0,
        newFee: feeStructure ? Number(feeStructure.totalFee) : 0,
        feeChange: feeStructure ? Number(feeStructure.totalFee) - (Number(s.totalFee) || 0) : 0,
        hasFeeStructure: !!feeStructure,
      };
    });

    return NextResponse.json({
      success: true, currentYear, nextYear,
      total: preview.length,
      willPromote: preview.filter(p => p.nextClass).length,
      willGraduate: preview.filter(p => !p.nextClass).length,
      missingFeeStructures: preview.filter(p => p.nextClass && !p.hasFeeStructure).length,
      data: preview,
    });
  } catch (err) {
    console.error('[GET rollover preview]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST Execute
export async function POST(req) {
  try {
    const { branch, currentYear, confirm, detainedStudents = [] } = await req.json();

    if (!currentYear || !confirm) {
      return NextResponse.json({ success: false, error: 'currentYear and confirm required' }, { status: 400 });
    }

    const where = { academicYear: currentYear, status: 'Active' };
    if (branch) where.branch = branch;

    const students = await prisma.student.findMany({ where });
    const nextYear = getNextAcademicYear(currentYear);

    const feeStructures = await prisma.feeStructure.findMany({
      where: { academicYear: nextYear, ...(branch && { branch }), isActive: true },
    });

    let promoted = 0, graduated = 0, detained = 0, errors = 0;
    const failedStudents = [];
    const missingFeeStructures = new Set();

    for (const student of students) {
      const isDetained = detainedStudents.includes(student.id);
      const nextClass = isDetained ? student.class : NEXT_CLASS[student.class];

      try {
        if (nextClass) {
          const feeStructure = feeStructures.find(f => f.class === nextClass);
          
          if (!feeStructure) {
            missingFeeStructures.add(nextClass);
            console.warn(`No fee structure for ${nextClass} in ${nextYear}`);
          }

          const newTotalFee = feeStructure ? Number(feeStructure.totalFee) : Number(student.totalFee) || 0;
          const term1Fee = feeStructure ? Number(feeStructure.term1Fee) : 0;
          const term2Fee = feeStructure ? Number(feeStructure.term2Fee) : 0;
          const term3Fee = feeStructure ? Number(feeStructure.term3Fee) : 0;

          let term1Due, term2Due, term3Due;
          if (feeStructure && term1Fee > 0) {
            term1Due = term1Fee;
            term2Due = term2Fee;
            term3Due = term3Fee;
          } else {
            const base = Math.floor(newTotalFee / 3);
            const extra = newTotalFee - base * 3;
            term1Due = base + extra;
            term2Due = base;
            term3Due = base;
          }

          await prisma.student.update({
            where: { id: student.id },
            data: {
              class: nextClass, academicYear: nextYear,
              totalFee: newTotalFee, paidFee: 0,
              term1: 0, term2: 0, term3: 0,
              term1Due, term2Due, term3Due,
              presentDays: 0, absentDays: 0,
              totalWorkingDays: 0, todayAttendance: '',
            },
          });

          if (student.userId) {
            await prisma.user.update({
              where: { id: student.userId },
              data: { class: nextClass },
            }).catch(e => console.warn(`User sync skipped for ${student.id}`));
          }

          await prisma.promotionHistory.create({
            data: {
              studentId: student.id, studentName: student.name,
              rollNo: student.rollNo, fromClass: student.class,
              toClass: nextClass, fromAcademicYear: currentYear,
              toAcademicYear: nextYear, fromSection: student.section,
              toSection: student.section,
              promotionType: isDetained ? 'detained' : 'promoted',
              branch: student.branch, branchId: student.branchId,
              oldFee: Number(student.totalFee) || 0,
              newFee: newTotalFee, promotedBy: 'System',
            },
          });

          isDetained ? detained++ : promoted++;
        } else {
          await prisma.student.update({
            where: { id: student.id },
            data: { status: 'Passed Out', academicYear: nextYear },
          });

          if (student.userId) {
            await prisma.user.update({
              where: { id: student.userId },
              data: { isActive: false },
            }).catch(e => console.warn(`User deactivate skipped`));
          }

          await prisma.promotionHistory.create({
            data: {
              studentId: student.id, studentName: student.name,
              rollNo: student.rollNo, fromClass: student.class,
              toClass: 'Passed Out', fromAcademicYear: currentYear,
              toAcademicYear: nextYear, fromSection: student.section,
              toSection: '', promotionType: 'passed_out',
              branch: student.branch, branchId: student.branchId,
              oldFee: Number(student.totalFee) || 0, newFee: 0,
              promotedBy: 'System',
            },
          });

          graduated++;
        }
      } catch (err) {
        console.error(`Rollover failed for ${student.id}:`, err);
        failedStudents.push({ id: student.id, name: student.name, error: err.message });
        errors++;
      }
    }

    const teacherResult = await prisma.teacher.updateMany({
      where: { ...(branch && { branch }), status: 'Active' },
      data: { academicYear: nextYear, presentDays: 0, absentDays: 0, totalDays: 0 },
    });

    return NextResponse.json({
      success: true,
      message: `Rollover complete: ${currentYear} → ${nextYear}`,
      promoted, detained, graduated,
      teachersUpdated: teacherResult.count,
      errors, nextYear,
      warnings: missingFeeStructures.size > 0 
        ? `Missing fee structures for: ${Array.from(missingFeeStructures).join(', ')}`
        : null,
      ...(errors > 0 && { failedStudents }),
    });
  } catch (err) {
    console.error('[POST rollover]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}