// scripts/fix-attendance.js
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const url = process.env.DATABASE_URL;

async function fixAttendance() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('school-erp');
    const attendance = db.collection('Attendance');

    // Drop the problematic index
    try {
      await attendance.dropIndex('Attendance_entityId_date_key');
      console.log('✅ Dropped existing attendance index\n');
    } catch (e) {
      console.log('ℹ️  No existing attendance index to drop\n');
    }

    // Delete records with null entityId
    const result = await attendance.deleteMany({
      $or: [
        { entityId: null },
        { entityId: { $exists: false } }
      ]
    });

    console.log(`✅ Deleted ${result.deletedCount} invalid attendance records\n`);
    console.log('Now run: npx prisma db push\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixAttendance();