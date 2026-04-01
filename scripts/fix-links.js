const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStudentLinks() {
  console.log('🔧 Fixing User ↔ Student links...\n');

  // Get all student users
  const users = await prisma.user.findMany({
    where: { role: 'student' }
  });

  console.log(`Found ${users.length} student users\n`);

  let fixed = 0;
  let errors = 0;

  for (const user of users) {
    try {
      let student = null;

      // Find by username
      if (!student && user.username) {
        student = await prisma.student.findFirst({
          where: { username: { equals: user.username, mode: 'insensitive' } }
        });
      }

      // Find by rollNo + branch
      if (!student && user.rollNo) {
        student = await prisma.student.findFirst({
          where: { 
            rollNo: { equals: user.rollNo, mode: 'insensitive' },
            branch: user.branch || undefined
          }
        });
      }

      // Find by User.studentId
      if (!student && user.studentId) {
        try {
          student = await prisma.student.findUnique({
            where: { id: user.studentId }
          });
        } catch (e) {}
      }

      if (student) {
        // Update both records to link them
        await prisma.user.update({
          where: { id: user.id },
          data: { studentId: student.id }
        });

        await prisma.student.update({
          where: { id: student.id },
          data: { 
            userId: user.id,
            username: user.username.toLowerCase()
          }
        });

        console.log(`✅ ${user.username} ↔ ${student.name} (${student.rollNo})`);
        fixed++;
      } else {
        console.log(`⚠️ No student found for: ${user.username} (rollNo: ${user.rollNo})`);
        errors++;
      }
    } catch (e) {
      console.log(`❌ Error for ${user.username}:`, e.message);
      errors++;
    }
  }

  console.log(`\n✅ Fixed: ${fixed}`);
  console.log(`⚠️ Not found: ${errors}`);
  
  await prisma.$disconnect();
}

fixStudentLinks();