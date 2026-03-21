import { NextResponse } from 'next/server';
import * as XLSX        from 'xlsx';
import bcrypt           from 'bcryptjs';
import connectDB        from '@/lib/mongodb';
import mongoose         from 'mongoose';

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

function normalize(key) {
  return key?.toString().toLowerCase().trim().replace(/\s+/g, '');
}

function mapRow(rawRow) {
  const mapped  = {};
  const rawKeys = Object.keys(rawRow);
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const matchedKey = rawKeys.find(k => aliases.includes(normalize(k)));
    if (matchedKey !== undefined) {
      mapped[field] = rawRow[matchedKey]?.toString().trim() || '';
    }
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

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rawRows  = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

    if (!rawRows.length) {
      return NextResponse.json({ success: false, message: 'File is empty' }, { status: 400 });
    }

    await connectDB();
    const staffCol = mongoose.connection.db.collection('staff');
    const usersCol = mongoose.connection.db.collection('users');

    let inserted = 0, skipped = 0;
    const errors      = [];
    const credentials = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row    = mapRow(rawRows[i]);
      const rowNum = i + 2;

      if (!row.name || !row.role) {
        errors.push({ row: rowNum, reason: `Missing: ${!row.name ? 'name' : 'role'}` });
        skipped++; continue;
      }

      const employeeId = `STF${Date.now().toString().slice(-4)}${String(i).padStart(2, '0')}`;
      const username   = row.username || `staff.${row.name.toLowerCase().replace(/\s+/g, '.')}.${branch.toLowerCase().replace(/\s+/g, '')}${i}`;
      const plainPwd   = row.password || DEFAULT_PASSWORD;

      const userExists = await usersCol.findOne({ username });
      if (userExists) {
        errors.push({ row: rowNum, reason: `Username "${username}" already taken` });
        skipped++; continue;
      }

      try {
        const hashedPwd = await bcrypt.hash(plainPwd, 10);

        const staffDoc = {
          ...row,
          branch,
          branchId,
          employeeId,
          username,
          status:      row.status || 'Active',
          salary:      Number(row.salary) || 0,
          presentDays: 0,
          absentDays:  0,
          totalDays:   0,
          createdAt:   new Date(),
          updatedAt:   new Date(),
        };
        delete staffDoc.password;
        const result = await staffCol.insertOne(staffDoc);

        await usersCol.insertOne({
          username,
          password:   hashedPwd,
          role:       'staff',
          branch,
          branchId,
          staffId:    result.insertedId,
          employeeId,
          name:       row.name,
          email:      row.email || '',
          createdAt:  new Date(),
        });

        credentials.push({
          name:       row.name,
          employeeId,
          username,
          password:   plainPwd,
        });

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
