import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/prisma';
import mongoose from 'mongoose';

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

function normalize(key) {
  return key?.toString().toLowerCase().replace(/\s+/g, '');
}

function mapRow(rawRow) {
  const mapped  = {};
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
  const base = name.toLowerCase().replace(/\s+/g, '.');
  const bran = branch.toLowerCase().replace(/\s+/g, '');
  return `${base}.${bran}`;
}

const DEFAULT_PASSWORD = 'Teacher@123';

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
    const rawRows  = XLSX.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
      { defval: '' }
    );

    if (!rawRows.length) {
      return NextResponse.json({ success: false, message: 'File is empty' }, { status: 400 });
    }

    await connectDB();
    const teachersCol = mongoose.connection.db.collection('teachers');
    const usersCol    = mongoose.connection.db.collection('users');

    const teachers    = [];
    const users       = [];
    const credentials = [];
    const errors      = [];
    let skipped       = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row    = mapRow(rawRows[i]);
      const rowNum = i + 2;

      if (!row.name) {
        errors.push({ row: rowNum, reason: 'Name is required' });
        skipped++; 
        continue;
      }

      const employeeId = generateEmployeeId(row.name, i);

      // Normalize username to lowercase
      const rawUsername = row.username || autoUsername(row.name, branch);
      const username    = rawUsername.toLowerCase().trim();
      const plainPwd    = row.password || DEFAULT_PASSWORD;

      // Check collision against normalized username
      const userExists = await usersCol.findOne({
        username: { $regex: `^${username}$`, $options: 'i' },
      });
      if (userExists) {
        errors.push({ row: rowNum, reason: `Username "${username}" already taken` });
        skipped++; 
        continue;
      }

      // Check if class teacher assignment conflicts
      const isClassTeacher = row.classTeacher === 'true' || row.classTeacher === 'yes' || row.classTeacher === '1' || row.classTeacher === 'Yes' || row.classTeacher === 'TRUE';
      const assignedClass = row.assignedClass || (isClassTeacher ? row.class : '');
      const section = row.section || '';

      if (isClassTeacher && assignedClass && section) {
        const existingCT = await teachersCol.findOne({
          assignedClass,
          section,
          classTeacher: true,
          branch,
        });
        if (existingCT) {
          errors.push({ row: rowNum, reason: `${assignedClass}-${section} already has class teacher: ${existingCT.name}` });
          skipped++;
          continue;
        }
      }

      const hashedPwd = await bcrypt.hash(plainPwd, 10);
      const teacherId = new mongoose.Types.ObjectId();
      const userId    = new mongoose.Types.ObjectId();

      // Remove password from row data
      const { password: _p, classTeacher: _ct, ...rowClean } = row;

      teachers.push({
        _id: teacherId,
        ...rowClean,
        branch, 
        branchId, 
        employeeId,
        username,
        userId,
        classTeacher: isClassTeacher,
        assignedClass: isClassTeacher ? assignedClass : '',
        section: section,
        status: row.status || 'Active',
        salary: Number(row.salary) || 0,
        presentDays: 0, 
        absentDays: 0, 
        totalDays: 0,
        createdAt: new Date(), 
        updatedAt: new Date(),
      });

      users.push({
        _id: userId,
        username,
        password: hashedPwd,
        role: 'teacher',
        branch,
        branchId,
        teacherId,
        employeeId,
        name: row.name,
        email: row.email || '',
        isActive: true,
        createdAt: new Date(),
      });

      credentials.push({ 
        name: row.name, 
        employeeId, 
        username, 
        password: plainPwd,
        classTeacher: isClassTeacher ? `${assignedClass}-${section}` : ''
      });
    }

    if (teachers.length) {
      await teachersCol.insertMany(teachers);
      await usersCol.insertMany(users);
    }

    return NextResponse.json({
      success: teachers.length > 0,
      inserted: teachers.length,
      skipped,
      errors: errors.slice(0, 10), // Limit errors shown
      credentials,
      message: teachers.length > 0
        ? `✅ ${teachers.length} teacher(s) inserted, ${skipped} skipped.`
        : `No teachers inserted. ${skipped} row(s) skipped.`,
    });

  } catch (err) {
    console.error('[bulk-upload/teachers]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}