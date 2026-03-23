import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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
  const mapped = {};
  const rawKeys = Object.keys(rawRow);
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const matchedKey = rawKeys.find(k => aliases.includes(normalize(k)));
    if (matchedKey !== undefined)
      mapped[field] = rawRow[matchedKey]?.toString().trim() || '';
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

    if (!file)
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });

    const buffer   = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rawRows  = XLSX.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
      { defval: '' }
    );

    if (!rawRows.length)
      return NextResponse.json({ success: false, message: 'File is empty' }, { status: 400 });

    let inserted = 0, updated = 0, skipped = 0;
    const errors = [], credentials = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row    = mapRow(rawRows[i]);
      const rowNum = i + 2;

      const missing = REQUIRED.filter(f => !row[f]);
      if (missing.length) {
        errors.push({ row: rowNum, reason: `Missing: ${missing.join(', ')}` });
        skipped++; 
        continue;
      }

      try {
        // ✅ REMOVED include: { user: true } - not supported by schema
        const existing = await prisma.student.findFirst({
          where: { rollNo: row.rollNo, branch },
        });

        const rawUsername   = row.username || `student.${row.rollNo.toLowerCase()}`;
        const baseUsername  = rawUsername.toLowerCase().trim();
        const plainPwd      = row.password || DEFAULT_PASSWORD;
        const hashedPwd     = await bcrypt.hash(plainPwd, 10);

        if (existing) {
          // ── UPDATE EXISTING STUDENT ──
          
          let finalUsername = existing.username || baseUsername;
          let linkedUserId = existing.userId;

          // Check if user exists by userId or find by rollNo
          let userRecord = null;
          if (linkedUserId) {
            userRecord = await prisma.user.findUnique({ where: { id: linkedUserId } });
          }
          if (!userRecord) {
            userRecord = await prisma.user.findFirst({
              where: { rollNo: row.rollNo, role: 'student' }
            });
            linkedUserId = userRecord?.id;
          }

          // Case 1: Student has NO linked user → Create one
          if (!userRecord) {
            const userExists = await prisma.user.findUnique({ where: { username: baseUsername } });
            finalUsername = userExists ? `${baseUsername}.${row.rollNo}` : baseUsername;

            userRecord = await prisma.user.create({
              data: {
                username:  finalUsername,
                password:  hashedPwd,
                role:      'student',
                name:      row.name,
                email:     row.email || '',
                phone:     row.phone || '',
                branch,
                branchId,
                rollNo:    row.rollNo,
                class:     row.class,
                section:   row.section,
                isActive:  true,
              },
            });

            credentials.push({
              name:     row.name,
              rollNo:   row.rollNo,
              username: finalUsername,
              password: plainPwd,
              status:   'User Created (was missing)',
            });

            linkedUserId = userRecord.id;
          } 
          // Case 2: User exists → Update it
          else {
            finalUsername = userRecord.username;

            // Update user data
            const userUpdateData = {
              name:     row.name,
              email:    row.email    || userRecord.email,
              phone:    row.phone    || userRecord.phone,
              class:    row.class,
              section:  row.section,
            };

            // Update password if provided in CSV
            if (row.password) {
              userUpdateData.password = hashedPwd;
              credentials.push({
                name:     row.name,
                rollNo:   row.rollNo,
                username: finalUsername,
                password: plainPwd,
                status:   'Password Updated',
              });
            }

            await prisma.user.update({
              where: { id: userRecord.id },
              data: userUpdateData,
            }).catch(err => console.warn('[user update skipped]', err.message));
          }

          // Update student record
          await prisma.student.update({
            where: { id: existing.id },
            data: {
              name:          row.name,
              class:         row.class,
              section:       row.section,
              gender:        row.gender        || existing.gender,
              parentName:    row.parentName    || existing.parentName,
              phone:         row.phone         || existing.phone,
              email:         row.email         || existing.email,
              totalFee:      row.totalFee ? Number(row.totalFee) : existing.totalFee,
              bloodGroup:    row.bloodGroup    || existing.bloodGroup,
              caste:         row.caste         || existing.caste,
              aadhaar:       row.aadhaar       || existing.aadhaar,
              yearOfJoining: row.yearOfJoining || existing.yearOfJoining,
              academicYear:  row.academicYear  || existing.academicYear,
              username:      finalUsername,
              userId:        linkedUserId,
            },
          });

          updated++;

        } else {
          // ── INSERT NEW STUDENT + USER ──
          
          const userExists    = await prisma.user.findUnique({ where: { username: baseUsername } });
          const finalUsername = userExists ? `${baseUsername}.${row.rollNo}` : baseUsername;

          // Create User
          const userRecord = await prisma.user.create({
            data: {
              username:  finalUsername,
              password:  hashedPwd,
              role:      'student',
              name:      row.name,
              email:     row.email    || '',
              phone:     row.phone    || '',
              branch,
              branchId,
              rollNo:    row.rollNo,
              class:     row.class,
              section:   row.section,
              isActive:  true,
            },
          });

          // Create Student
          await prisma.student.create({
            data: {
              name:          row.name,
              rollNo:        row.rollNo,
              class:         row.class,
              section:       row.section,
              gender:        row.gender        || '',
              parentName:    row.parentName    || '',
              phone:         row.phone         || '',
              email:         row.email         || '',
              bloodGroup:    row.bloodGroup    || '',
              caste:         row.caste         || '',
              aadhaar:       row.aadhaar       || '',
              yearOfJoining: row.yearOfJoining || '',
              academicYear:  row.academicYear  || '2025-26',
              totalFee:      Number(row.totalFee) || 0,
              branch,
              branchId,
              username:      finalUsername,
              userId:        userRecord.id,
              status:        'Active',
              paidFee:       0,
            },
          });

          credentials.push({
            name:     row.name,
            rollNo:   row.rollNo,
            username: finalUsername,
            password: plainPwd,
            status:   'New Student',
          });
          inserted++;
        }

      } catch (err) {
        console.error(`Row ${rowNum} error:`, err);
        errors.push({
          row:    rowNum,
          reason: err.code === 'P2002'
            ? `Duplicate: ${err.meta?.target?.join(', ') || 'unique constraint'}`
            : err.message?.slice(0, 100) || 'Unknown error',
        });
        skipped++;
      }
    }

    return NextResponse.json({
      success: inserted > 0 || updated > 0,
      message: `✅ ${inserted} inserted, ${updated} updated, ${skipped} skipped.`,
      inserted, 
      updated, 
      skipped, 
      errors: errors.slice(0, 10), // Limit errors shown
      credentials,
    });

  } catch (err) {
    console.error('[bulk-upload/students]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}