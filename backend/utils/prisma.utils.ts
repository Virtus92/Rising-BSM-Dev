import { PrismaClient } from '../prisma/generated/client';

// Logging settings
const prismaLogging: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' 
  ? ['warn', 'error'] 
  : ['error'];

// Create a new PrismaClient if one doesn't exist
const prisma = new PrismaClient({
  log: prismaLogging,
});

// Handle disconnection on shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// This ensures unhandled rejections don't crash the app
process.on('unhandledRejection', async (err) => {
  console.error('Unhandled rejection in Prisma client:', err);
});

// Export the client
export default prisma;