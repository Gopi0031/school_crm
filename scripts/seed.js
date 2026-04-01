import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  const hash = await bcrypt.hash('Admin123', 12);

  await prisma.user.upsert({
    where:  { username: 'superadmin' },
    update: {
      name: 'Chairman',   // ✅ updates name if user already exists
    },
    create: {
      username:    'superadmin',
      password:    hash,
      role:        'super-admin',
      name:        'Chairman',   // ✅ new installs get Chairman too
      email:       'superadmin@school.com',
      isActive:    true,
    },
  });

  console.log('✅ Super admin: superadmin / Admin123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());