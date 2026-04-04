// scripts/create-missing-students.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingStudents() {
  console.log('🏗️  Creating missing student records...\n');

  try {
    const studentUsers = await prisma.user.findMany({
      where: { 
        role: 'student',
        studentId: null // Users without linked students
      }
    });

    console.log(`Found ${studentUsers.length} users without student records\n`);

    let created = 0;

    for (const user of studentUsers) {
      try {
        // Check if student exists by username or rollNo
        const existing = await prisma.student.findFirst({
          where: {
            OR: [
              { username: user.username },
              { rollNo: user.rollNo, branch: user.branch }
            ]
          }
        });

        if (existing) {
          // Link existing student
          await prisma.user.update({
            where: { id: user.id },
            data: { studentId: existing.id }
          });
          await prisma.student.update({
            where: { id: existing.id },
            data: { userId: user.id }
          });
          console.log(`  🔗 Linked existing: ${user.username}`);
        } else {
          // Create new student record
          const student = await prisma.student.create({
            data: {
              name: user.name || user.username,
              rollNo: user.rollNo || `TMP-${Date.now()}`,
              class: user.class || '1',
              section: user.section || 'A',
              branch: user.branch || 'Main',
              branchId: user.branchId || '',
              username: user.username,
              userId: user.id,
              phone: user.phone || '',
              email: user.email || '',
              status: 'Active'
            }
          });

          // Link to user
          await prisma.user.update({
            where: { id: user.id },
            data: { studentId: student.id }
          });

          console.log(`  ✅ Created: ${student.name} (${student.rollNo})`);
          created++;
        }
      } catch (e) {
        console.log(`  ❌ Error for ${user.username}:`, e.message);
      }
    }

    console.log(`\n✅ Created ${created} new student records`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingStudents();