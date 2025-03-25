import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcryptjs.hash('AdminPass123!', 10);
    
    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        phone: null,
      }
    });
    
    console.log(`Admin user created or updated: ${adminUser.email}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Execute the seed function
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    // Close the database connection when done
    await prisma.$disconnect();
  });