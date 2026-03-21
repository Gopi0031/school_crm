// src/app/api/students/bulk-upload/route.js
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

const REQUIRED = ['name', 'rollNo', 'class', 'section'];

const ALIASES = {
  name:          ['name', 'student name', 'full name', 'studentname'],
  rollNo:        ['rollno', 'roll no', 'roll number', 'roll', 'rollnumber'],
  class:         ['class', 'std', 'standard', 'grade'],
  section:       ['section', 'sec', 'div', 'division'],
  gender:        ['gender', 'sex'],
  parentName:    ['parentname', 'parent name', 'father name', 'guardian'],
  phone:         ['phone', 'mobile', 'contact', 'phone number'],
  email:         ['email', 'mail', 'email id'],
  totalFee:      ['totalfee', 'total fee', 'fee', 'fees'],
  bloodGroup:    ['bloodgroup', 'blood group', 'blood'],
  caste:         ['caste', 'category'],
  aadhaar:       ['aadhaar', 'aadhar', 'aadhaar number'],
  yearOfJoining: ['yearofjoining', 'year of joining', 'joining year', 'admission year'],
  academicYear:  ['academicyear', 'academic year', 'session'],
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

const DEFAULT_PASSWORD = 'Student@123';

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
    const studentsCol = mongoose.connection.db.collection('students');
    const usersCol    = mongoose.connection.db.collection('users');

    let inserted      = 0;
    let updated       = 0;
    let skipped       = 0;
    const errors      = [];
    const credentials = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row    = mapRow(rawRows[i]);
      const rowNum = i + 2;

      // Validate required fields
      const missing = REQUIRED.filter(f => !row[f]);
      if (missing.length > 0) {
        errors.push({ row: rowNum, reason: `Missing: ${missing.join(', ')}` });
        skipped++; continue;
      }

      try {
        const { password: _p, ...rowClean } = row;

        // ✅ Find by rollNo only — branch mismatch was causing false "not found"
        const existingStudent = await studentsCol.findOne({ rollNo: row.rollNo });

        if (existingStudent) {
          // UPDATE existing student
          await studentsCol.updateOne(
            { rollNo: row.rollNo },
            {
              $set: {
                ...rowClean,
                branch,
                branchId,
                updatedAt: new Date(),
              },
            }
          );

          // Update linked user (name + email only, never touch username/password)
          if (existingStudent.userId) {
            await usersCol.updateOne(
              { _id: existingStudent.userId },
              {
                $set: {
                  name:      row.name,
                  email:     row.email || '',
                  updatedAt: new Date(),
                },
              }
            );
          }

          updated++;

        } else {
          // INSERT new student + user
          const rawUsername  = row.username || `student.${row.rollNo.toLowerCase()}`;
          const username     = rawUsername.toLowerCase().trim();
          const plainPwd     = row.password || DEFAULT_PASSWORD;

          // Handle duplicate username by appending rollNo suffix
          const userExists   = await usersCol.findOne({
            username: { $regex: `^${username}$`, $options: 'i' },
          });
          const finalUsername = userExists ? `${username}.${row.rollNo}` : username;

          const hashedPwd = await bcrypt.hash(plainPwd, 10);
          const studentId = new mongoose.Types.ObjectId();
          const userId    = new mongoose.Types.ObjectId();   // ← pre-generate

          await studentsCol.insertOne({
            _id: studentId,
            ...rowClean,
            branch,
            branchId,
            username: finalUsername,
            userId,
            status:           'Active',
            paidFee:          0,
            term1:            0,
            term2:            0,
            term3:            0,
            presentDays:      0,
            totalWorkingDays: 220,
            createdAt:        new Date(),
            updatedAt:        new Date(),
          });

          await usersCol.insertOne({
            _id:       userId,
            username:  finalUsername,
            password:  hashedPwd,
            role:      'student',
            branch,
            branchId,
            studentId,
            rollNo:    row.rollNo,
            name:      row.name,
            email:     row.email || '',
            isActive:  true,
            createdAt: new Date(),
          });

          credentials.push({
            name:     row.name,
            rollNo:   row.rollNo,
            username: finalUsername,
            password: plainPwd,
          });
          inserted++;
        }

      } catch (err) {
        // ✅ Catch duplicate key but still report clearly
        errors.push({
          row: rowNum,
          reason: err.code === 11000
            ? `Duplicate rollNo "${row.rollNo}" — already exists and could not be updated`
            : err.message,
        });
        skipped++;
      }
    }

    return NextResponse.json({
      success: inserted > 0 || updated > 0,
      message: `${inserted} inserted, ${updated} updated, ${skipped} skipped.`,
      inserted, updated, skipped, errors, credentials,
    });

  } catch (err) {
    console.error('[bulk-upload/students]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
