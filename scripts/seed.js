import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  const hash = await bcrypt.hash('Admin123', 12);

  await prisma.user.upsert({
    where:  { username: 'superadmin' },
    update: {},
    create: {
      username:    'superadmin',
      password:    hash,
      role:        'super-admin',
      name:        'Super Admin',
      email:       'superadmin@school.com',
      isActive:    true,
    },
  });

  console.log('✅ Super admin: superadmin / Admin123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
