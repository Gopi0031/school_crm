require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

async function fix() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to:', uri.replace(/:([^@]+)@/, ':****@')); // hide password
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  console.log('✅ Connected to DB:', db.databaseName);

  const studentsCol = db.collection('students');
  const usersCol    = db.collection('users');

  const totalStudents = await studentsCol.countDocuments();
  const totalUsers    = await usersCol.countDocuments();
  const studentUsers  = await usersCol.countDocuments({ role: 'student' });

  console.log(`\n📊 students collection : ${totalStudents} docs`);
  console.log(`📊 users collection    : ${totalUsers} docs`);
  console.log(`📊 student role users  : ${studentUsers}\n`);

  if (totalStudents === 0) {
    console.error('❌ No students found! Wrong database?');
    process.exit(1);
  }

  const students = await studentsCol.find({}).toArray();
  let created = 0, linked = 0, skipped = 0;

  for (const student of students) {
    const queries = [
      student.userId     ? { _id: new mongoose.Types.ObjectId(String(student.userId)) } : null,
      { studentId: student._id },
      { rollNo: student.rollNo, role: 'student' },
    ].filter(Boolean);

    const existingUser = await usersCol.findOne({ $or: queries });

    if (existingUser) {
      if (!student.userId) {
        await studentsCol.updateOne({ _id: student._id }, { $set: { userId: existingUser._id } });
        linked++;
        console.log(`🔗 Linked : ${student.name} → ${existingUser.username}`);
      } else {
        skipped++;
      }
      continue;
    }

    // Create missing user
    const rawUsername = student.username
      || `student.${(student.rollNo || String(student._id)).toLowerCase().replace(/\s+/g, '')}`;
    const username  = rawUsername.toLowerCase().trim();
    const plainPwd  = 'Student@123';
    const hashed    = await bcrypt.hash(plainPwd, 10);
    const userId    = new mongoose.Types.ObjectId();

    await usersCol.insertOne({
      _id:       userId,
      username,
      password:  hashed,
      role:      'student',
      name:      student.name     || '',
      email:     student.email    || '',
      phone:     student.phone    || '',
      branch:    student.branch   || '',
      branchId:  student.branchId || '',
      class:     student.class    || '',
      section:   student.section  || '',
      rollNo:    student.rollNo   || '',
      studentId: student._id,
      isActive:  true,
      createdAt: new Date(),
    });

    await studentsCol.updateOne({ _id: student._id }, { $set: { userId, username } });

    console.log(`✅ Created : ${username}  (${student.name})`);
    created++;
  }

  console.log('\n──────────────────────────────────');
  console.log(`✅ Created  : ${created}`);
  console.log(`🔗 Linked   : ${linked}`);
  console.log(`⏭  Skipped  : ${skipped}`);

  // ── Final verify ──────────────────────────────────────────
  const finalCount = await usersCol.countDocuments({ role: 'student' });
  console.log(`\n🎯 Student users now in DB: ${finalCount}`);

  // Print first 3 student usernames so you can test
  const samples = await usersCol.find({ role: 'student' }).limit(3).toArray();
  console.log('\n🔑 Test these logins (password: Student@123):');
  samples.forEach(u => console.log(`   username: ${u.username}`));

  process.exit(0);
}

fix().catch(err => {
  console.error('❌ Script error:', err.message);
  process.exit(1);
});
