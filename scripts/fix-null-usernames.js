// scripts/fix-null-usernames.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNullUsernames() {
  console.log('🔧 Fixing null usernames...\n');

  try {
    // Find all users with null or empty usernames
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: null },
          { username: '' }
        ]
      }
    });

    console.log(`Found ${users.length} users with null/empty usernames\n`);

    for (const user of users) {
      let newUsername;

      // Generate username based on available data
      if (user.email) {
        newUsername = user.email.split('@')[0].toLowerCase();
      } else if (user.name) {
        newUsername = user.name.toLowerCase().replace(/\s+/g, '');
      } else if (user.rollNo) {
        newUsername = `student_${user.rollNo}`.toLowerCase();
      } else {
        newUsername = `user_${user.id.substring(0, 8)}`;
      }

      // Ensure uniqueness
      let finalUsername = newUsername;
      let counter = 1;

      while (true) {
        const existing = await prisma.user.findUnique({
          where: { username: finalUsername }
        });

        if (!existing) break;

        finalUsername = `${newUsername}_${counter}`;
        counter++;
      }

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: { username: finalUsername }
      });

      console.log(`✅ ${user.id} → ${finalUsername} (role: ${user.role})`);
    }

    console.log(`\n✅ Fixed ${users.length} usernames!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNullUsernames();