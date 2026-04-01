import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ── Class progression map ─────────────────────────────────────────────────
const NEXT_CLASS = {
  'Class 1':  'Class 2',
  'Class 2':  'Class 3',
  'Class 3':  'Class 4',
  'Class 4':  'Class 5',
  'Class 5':  'Class 6',
  'Class 6':  'Class 7',
  'Class 7':  'Class 8',
  'Class 8':  'Class 9',
  'Class 9':  'Class 10',
  'Class 10': 'Class 11',
  'Class 11': 'Class 12',
  // Class 12 → graduates (no next class)
};

// ── Academic year helper: "2025-26" → "2026-27" ──────────────────────────
function getNextAcademicYear(current) {
  const match = current?.match(/^(\d{4})-(\d{2,4})$/);
  if (!match) {
    const year = new Date().getFullYear();
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  const startYear = parseInt(match[1]) + 1;
  const endShort  = String(startYear + 1).slice(-2);
  return `${startYear}-${endShort}`;
}

// ── Split totalFee into 3 term dues ───────────────────────────────────────
// Returns { term1Due, term2Due, term3Due }
// Extra rupee (from remainder) goes to term1
function splitTermDues(totalFee) {
  const total = Number(totalFee) || 0;
  if (total === 0) return { term1Due: 0, term2Due: 0, term3Due: 0 };
  const base  = Math.floor(total / 3);
  const extra = total - base * 3;  // 0, 1, or 2
  return {
    term1Due: base + extra,  // e.g. ₹11,667 (gets the extra rupee)
    term2Due: base,          // e.g. ₹11,667
    term3Due: base,          // e.g. ₹11,666
  };
}

// ─────────────────────────────────────────────────────────────────────────
// GET — Dry-run preview (no DB changes)
// ─────────────────────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch      = searchParams.get('branch');
    const currentYear = searchParams.get('academicYear');

    if (!currentYear)
      return NextResponse.json({ error: 'academicYear required' }, { status: 400 });

    const where = { academicYear: currentYear, status: 'Active' };
    if (branch) where.branch = branch;

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true, name: true, rollNo: true,
        class: true, section: true, branch: true,
        academicYear: true, totalFee: true,
      },
    });

    const nextYear = getNextAcademicYear(currentYear);

    const preview = students.map(s => {
      const nextClass = NEXT_CLASS[s.class] || null;
      const { term1Due, term2Due, term3Due } = splitTermDues(s.totalFee);
      return {
        id:           s.id,
        name:         s.name,
        rollNo:       s.rollNo,
        branch:       s.branch,
        currentClass: s.class,
        section:      s.section,
        nextClass,
        willGraduate: !nextClass,
        status:       nextClass ? 'Active' : 'Passed',
        currentYear,
        nextYear,
        totalFee:     Number(s.totalFee) || 0,
        // What term dues will be reset to after rollover
        term1Due, term2Due, term3Due,
      };
    });

    return NextResponse.json({
      success:      true,
      currentYear,
      nextYear,
      total:        preview.length,
      willPromote:  preview.filter(p => p.nextClass).length,
      willGraduate: preview.filter(p => !p.nextClass).length,
      data:         preview,
    });
  } catch (err) {
    console.error('GET rollover preview error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// POST — Execute rollover
// ─────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { branch, currentYear, confirm } = await req.json();

    if (!currentYear)
      return NextResponse.json({ error: 'currentYear required' }, { status: 400 });
    if (!confirm)
      return NextResponse.json(
        { error: 'Pass confirm: true to execute rollover' },
        { status: 400 }
      );

    const where = { academicYear: currentYear, status: 'Active' };
    if (branch) where.branch = branch;

    const students = await prisma.student.findMany({ where });
    const nextYear  = getNextAcademicYear(currentYear);

    let promoted  = 0;
    let graduated = 0;
    let errors    = 0;
    const failedStudents = [];

    for (const student of students) {
      const nextClass = NEXT_CLASS[student.class];

      try {
        if (nextClass) {
          // ── Promote: next class + reset fee for new academic year ──
          const { term1Due, term2Due, term3Due } = splitTermDues(student.totalFee);

          await prisma.student.update({
            where: { id: student.id },
            data: {
              class:        nextClass,
              academicYear: nextYear,
              // ── Fee reset ──────────────────────────────────────────
              paidFee:  0,
              term1:    0,
              term2:    0,
              term3:    0,
              // Re-split dues from existing totalFee
              // Admin can update totalFee separately per student / bulk
              term1Due,
              term2Due,
              term3Due,
            },
          });

          // Also sync the linked User's class
          if (student.userId) {
            await prisma.user.update({
              where: { id: student.userId },
              data:  { class: nextClass },
            }).catch(e => {
              console.warn(`User sync skipped for student ${student.id}:`, e.message);
            });
          }

          promoted++;
        } else {
          // ── Class 12 → Graduate ────────────────────────────────────
          await prisma.student.update({
            where: { id: student.id },
            data: {
              status:       'Passed',
              academicYear: nextYear,
              // Don't reset fee for graduates — keep as record
            },
          });

          // Deactivate linked User login
          if (student.userId) {
            await prisma.user.update({
              where: { id: student.userId },
              data:  { isActive: false },
            }).catch(e => {
              console.warn(`User deactivate skipped for student ${student.id}:`, e.message);
            });
          }

          graduated++;
        }
      } catch (err) {
        console.error(`Rollover failed for student ${student.id} (${student.name}):`, err.message);
        failedStudents.push({ id: student.id, name: student.name, error: err.message });
        errors++;
      }
    }

    return NextResponse.json({
      success:   true,
      message:   `Rollover complete: ${currentYear} → ${nextYear}`,
      promoted,
      graduated,
      errors,
      nextYear,
      ...(errors > 0 && { failedStudents }),
    });
  } catch (err) {
    console.error('POST rollover error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}