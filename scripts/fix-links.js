// scripts/fix-links.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStudentLinks() {
  console.log('🔧 Fixing User ↔ Student links...\n');

  try {
    // Get all student users
    const users = await prisma.user.findMany({
      where: { role: 'student' }
    });

    console.log(`Found ${users.length} student users\n`);

    let fixed = 0;
    let created = 0;
    let errors = 0;

    for (const user of users) {
      try {
        let student = null;

        // Strategy 1: Try User.studentId first
        if (user.studentId) {
          try {
            student = await prisma.student.findUnique({
              where: { id: user.studentId }
            });
            if (student) console.log(`✓ Found via studentId: ${user.username}`);
          } catch (e) {
            console.log(`  ⚠ Invalid studentId for ${user.username}`);
          }
        }

        // Strategy 2: Try username match
        if (!student && user.username) {
          student = await prisma.student.findFirst({
            where: { 
              username: { 
                equals: user.username, 
                mode: 'insensitive' 
              } 
            }
          });
          if (student) console.log(`✓ Found via username: ${user.username}`);
        }

        // Strategy 3: Try rollNo + branch
        if (!student && user.rollNo && user.branch) {
          student = await prisma.student.findFirst({
            where: { 
              rollNo: { equals: user.rollNo, mode: 'insensitive' },
              branch: user.branch
            }
          });
          if (student) console.log(`✓ Found via rollNo+branch: ${user.username}`);
        }

        if (student) {
          // Update both records
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              studentId: student.id,
              class: student.class,
              section: student.section,
              rollNo: student.rollNo
            }
          });

          await prisma.student.update({
            where: { id: student.id },
            data: { 
              userId: user.id,
              username: user.username.toLowerCase()
            }
          });

          console.log(`  ✅ Linked: ${user.username} ↔ ${student.name} (${student.rollNo})`);
          fixed++;
        } else {
          console.log(`  ⚠️  No student record for: ${user.username}`);
          errors++;
        }
      } catch (e) {
        console.log(`  ❌ Error for ${user.username}:`, e.message);
        errors++;
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`⚠️  Missing: ${errors}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStudentLinks();