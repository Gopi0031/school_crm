import { NextResponse } from 'next/server';
import * as XLSX  from 'xlsx';
import bcrypt     from 'bcryptjs';
import prisma     from '@/lib/prisma';

const ALIASES = {
  name:          ['name', 'teachername', 'fullname', 'teacher name', 'full name'],
  phone:         ['phone', 'mobile', 'contact'],
  email:         ['email', 'mail'],
  qualification: ['qualification', 'degree', 'education'],
  experience:    ['experience', 'exp'],
  subject:       ['subject', 'subjects'],
  class:         ['class', 'std', 'grade'],
  section:       ['section', 'sec'],
  joinYear:      ['joinyear', 'joiningyear', 'join year'],
  salary:        ['salary', 'pay'],
  aadhaar:       ['aadhaar', 'aadhar'],
  pan:           ['pan'],
  status:        ['status'],
  classTeacher:  ['classteacher', 'class teacher', 'ct'],
  assignedClass: ['assignedclass', 'assigned class'],
  username:      ['username', 'login', 'userid', 'user name'],
  password:      ['password', 'pwd', 'pass'],
};

function normalize(key) { return key?.toString().toLowerCase().replace(/\s+/g, ''); }

function mapRow(rawRow) {
  const mapped = {};
  const rawKeys = Object.keys(rawRow);
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const key = rawKeys.find(k => aliases.includes(normalize(k)));
    if (key) mapped[field] = rawRow[key]?.toString().trim() || '';
  }
  return mapped;
}

function generateEmployeeId(name, index) {
  const prefix = name.replace(/\s+/g, '').toUpperCase().slice(0, 3) || 'TCH';
  return `${prefix}${Date.now().toString().slice(-4)}${index}`;
}

function autoUsername(name, branch) {
  return `${name.toLowerCase().replace(/\s+/g, '.')}.${branch.toLowerCase().replace(/\s+/g, '')}`;
}

const DEFAULT_PASSWORD = 'Teacher@123';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file     = formData.get('file');
    const branch   = formData.get('branch')   || '';
    const branchId = formData.get('branchId') || '';

    if (!file)
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });

    const buffer   = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rawRows  = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

    if (!rawRows.length)
      return NextResponse.json({ success: false, message: 'File is empty' }, { status: 400 });

    let inserted = 0, skipped = 0;
    const errors = [], credentials = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row    = mapRow(rawRows[i]);
      const rowNum = i + 2;

      if (!row.name) {
        errors.push({ row: rowNum, reason: 'Name is required' });
        skipped++; continue;
      }

      const employeeId     = generateEmployeeId(row.name, i);
      const username       = (row.username || autoUsername(row.name, branch)).toLowerCase().trim();
      const plainPwd       = row.password || DEFAULT_PASSWORD;
      const isClassTeacher = ['true','yes','1','Yes','TRUE'].includes(row.classTeacher);
      const assignedClass  = row.assignedClass || (isClassTeacher ? row.class : '');
      const section        = row.section || '';

      // ── Username collision check ──
      const userExists = await prisma.user.findUnique({ where: { username } });
      if (userExists) {
        errors.push({ row: rowNum, reason: `Username "${username}" already taken` });
        skipped++; continue;
      }

      // ── Class teacher conflict check ──
      if (isClassTeacher && assignedClass && section) {
        const conflict = await prisma.teacher.findFirst({
          where: { assignedClass, section, classTeacher: true, branch },
        });
        if (conflict) {
          errors.push({ row: rowNum, reason: `${assignedClass}-${section} already has class teacher: ${conflict.name}` });
          skipped++; continue;
        }
      }

      try {
        const hashedPwd = await bcrypt.hash(plainPwd, 10);

        const teacher = await prisma.teacher.create({
          data: {
            name:          row.name,
            phone:         row.phone         || '',
            email:         row.email         || '',
            qualification: row.qualification || '',
            experience:    row.experience    || '',
            subject:       row.subject       || '',
            class:         row.class         || '',
            section,
            joinYear:      row.joinYear      || '',
            salary:        Number(row.salary) || 0,
            aadhaar:       row.aadhaar       || '',
            pan:           row.pan           || '',
            branch,
            branchId,
            employeeId,
            username,
            classTeacher:  isClassTeacher,
            assignedClass: isClassTeacher ? assignedClass : '',
            status:        row.status || 'Active',
          },
        });

        const user = await prisma.user.create({
          data: {
            username,
            password:  hashedPwd,
            role:      'teacher',
            name:      row.name,
            email:     row.email || '',
            branch,
            branchId,
            employeeId,
            isActive:  true,
          },
        });

        await prisma.teacher.update({
          where: { id: teacher.id },
          data:  { userId: user.id },
        });

        credentials.push({
          name: row.name, employeeId, username, password: plainPwd,
          classTeacher: isClassTeacher ? `${assignedClass}-${section}` : '',
        });
        inserted++;
      } catch (err) {
        errors.push({ row: rowNum, reason: err.message });
        skipped++;
      }
    }

    return NextResponse.json({
      success: inserted > 0,
      inserted, skipped,
      errors:  errors.slice(0, 10),
      credentials,
      message: inserted > 0
        ? `✅ ${inserted} teacher(s) inserted, ${skipped} skipped.`
        : `No teachers inserted. ${skipped} row(s) skipped.`,
    });
  } catch (err) {
    console.error('[bulk-upload/teachers]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
