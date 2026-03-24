import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      profile: {
        create: {
          fullName: 'System Administrator',
          phone: '1234567890',
          status: 'ACTIVE',
        },
      },
    },
  });

  console.log('✅ Admin user created:', admin.username);

  // Create sample categories
  const beverages = await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: {
      name: 'Beverages',
      icon: '🥤',
    },
  });

  const mainCourse = await prisma.category.upsert({
    where: { name: 'Main Course' },
    update: {},
    create: {
      name: 'Main Course',
      icon: '🍽️',
    },
  });

  const desserts = await prisma.category.upsert({
    where: { name: 'Desserts' },
    update: {},
    create: {
      name: 'Desserts',
      icon: '🍰',
    },
  });

  console.log('✅ Categories created');

  // Create sample menu items
  await prisma.menuItem.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      categoryId: beverages.id,
      name: 'Fresh Juice',
      description: 'Freshly squeezed juice',
      price: 5.99,
      isAvailable: true,
    },
  });

  await prisma.menuItem.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      categoryId: mainCourse.id,
      name: 'Grilled Chicken',
      description: 'Tender grilled chicken with herbs',
      price: 15.99,
      isAvailable: true,
    },
  });

  console.log('✅ Sample menu items created');

  // Create sample tables
  for (let i = 1; i <= 10; i++) {
    await prisma.table.upsert({
      where: { tableNumber: `T${i}` },
      update: {},
      create: {
        tableNumber: `T${i}`,
        capacity: i <= 5 ? 4 : 6,
        status: 'AVAILABLE',
      },
    });
  }

  console.log('✅ Sample tables created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Default Admin Credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
