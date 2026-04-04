// scripts/force-fix-users.js
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const url = process.env.DATABASE_URL;

async function forceFixUsers() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('school-erp');
    const users = db.collection('User');

    // Step 1: Drop the problematic index if it exists
    try {
      await users.dropIndex('User_username_key');
      console.log('✅ Dropped existing username index\n');
    } catch (e) {
      console.log('ℹ️  No existing username index to drop\n');
    }

    // Step 2: Find users with null or missing usernames
    const nullUsers = await users.find({
      $or: [
        { username: null },
        { username: '' },
        { username: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${nullUsers.length} users with null/empty usernames\n`);

    if (nullUsers.length === 0) {
      console.log('✅ No users to fix!');
      return;
    }

    // Step 3: Fix each user
    for (const user of nullUsers) {
      let newUsername;

      if (user.email && user.email !== '') {
        newUsername = user.email.split('@')[0].toLowerCase();
      } else if (user.name && user.name !== '') {
        newUsername = user.name.toLowerCase().replace(/\s+/g, '_');
      } else if (user.rollNo && user.rollNo !== '') {
        newUsername = `student_${user.rollNo}`.toLowerCase();
      } else if (user.role) {
        newUsername = `${user.role}_${user._id.toString().substring(0, 8)}`;
      } else {
        newUsername = `user_${user._id.toString().substring(0, 8)}`;
      }

      // Ensure uniqueness
      let finalUsername = newUsername;
      let counter = 1;

      while (await users.findOne({ username: finalUsername })) {
        finalUsername = `${newUsername}_${counter}`;
        counter++;
      }

      // Update the user
      await users.updateOne(
        { _id: user._id },
        { $set: { username: finalUsername } }
      );

      console.log(`✅ ${user._id} → ${finalUsername} (role: ${user.role || 'unknown'})`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Fixed ${nullUsers.length} usernames!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log('Now run: npx prisma db push\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

forceFixUsers();