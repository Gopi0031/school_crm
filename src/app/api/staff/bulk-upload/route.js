import { NextResponse } from 'next/server';
import * as XLSX  from 'xlsx';
import bcrypt     from 'bcryptjs';
import prisma     from '@/lib/prisma';

const ALIASES = {
  name:          ['name', 'staff name', 'full name'],
  role:          ['role', 'designation', 'position', 'post'],
  phone:         ['phone', 'mobile', 'contact'],
  email:         ['email', 'mail'],
  qualification: ['qualification', 'degree', 'education'],
  joinYear:      ['joinyear', 'join year', 'joining year'],
  salary:        ['salary', 'monthly salary', 'pay'],
  aadhaar:       ['aadhaar', 'aadhar'],
  pan:           ['pan', 'pan number'],
  status:        ['status'],
  username:      ['username', 'user name', 'login', 'userid'],
  password:      ['password', 'pass', 'pwd'],
};

function normalize(key) { return key?.toString().toLowerCase().trim().replace(/\s+/g, ''); }

function mapRow(rawRow) {
  const mapped = {};
  const rawKeys = Object.keys(rawRow);
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const matchedKey = rawKeys.find(k => aliases.includes(normalize(k)));
    if (matchedKey !== undefined) mapped[field] = rawRow[matchedKey]?.toString().trim() || '';
  }
  return mapped;
}

const DEFAULT_PASSWORD = 'Staff@123';

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

      if (!row.name || !row.role) {
        errors.push({ row: rowNum, reason: `Missing: ${!row.name ? 'name' : 'role'}` });
        skipped++; continue;
      }

      const employeeId = `STF${Date.now().toString().slice(-4)}${String(i).padStart(2, '0')}`;
      const username   = (row.username || `staff.${row.name.toLowerCase().replace(/\s+/g, '.')}.${branch.toLowerCase().replace(/\s+/g, '')}${i}`).toLowerCase();
      const plainPwd   = row.password || DEFAULT_PASSWORD;

      const userExists = await prisma.user.findUnique({ where: { username } });
      if (userExists) {
        errors.push({ row: rowNum, reason: `Username "${username}" already taken` });
        skipped++; continue;
      }

      try {
        const hashedPwd = await bcrypt.hash(plainPwd, 10);

        const staff = await prisma.staff.create({
          data: {
            name:          row.name,
            employeeId,
            phone:         row.phone         || '',
            email:         row.email         || '',
            department:    row.role          || '',
            designation:   row.role          || '',
            qualification: row.qualification || '',
            joinYear:      row.joinYear      || '',
            salary:        Number(row.salary) || 0,
            aadhaar:       row.aadhaar       || '',
            pan:           row.pan           || '',
            branch,
            branchId,
            status:        row.status || 'Active',
            userId:        '',
          },
        });

        const user = await prisma.user.create({
          data: {
            username,
            password:   hashedPwd,
            role:       'staff',
            name:       row.name,
            email:      row.email || '',
            branch,
            branchId,
            employeeId,
            isActive:   true,
          },
        });

        // Link userId back to staff
        await prisma.staff.update({
          where: { id: staff.id },
          data:  { userId: user.id },
        });

        credentials.push({ name: row.name, employeeId, username, password: plainPwd });
        inserted++;
      } catch (err) {
        errors.push({ row: rowNum, reason: err.message });
        skipped++;
      }
    }

    return NextResponse.json({
      success: inserted > 0,
      message: `${inserted} staff member(s) inserted, ${skipped} skipped.`,
      inserted, skipped, errors, credentials,
    });
  } catch (err) {
    console.error('[bulk-upload/staff]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
