import prisma from '../utils/prisma.utils';

// Re-export the singleton instance
export { prisma };

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});