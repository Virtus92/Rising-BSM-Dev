/**
 * Prisma Test Utilities
 * 
 * Helper functions and types for testing repositories that use Prisma.
 */
import { PrismaClient } from '@prisma/client';
import { mockDeep, MockProxy, DeepMockProxy } from 'jest-mock-extended';

/**
 * Create a mock Prisma client for testing repositories
 * 
 * This function creates a deeply mocked Prisma client that can be used
 * in repository tests. The mock has proper typing so TypeScript won't
 * complain about method calls.
 * 
 * @returns A mocked Prisma client
 */
export function createMockPrismaClient(): DeepMockProxy<PrismaClient> {
  return mockDeep<PrismaClient>();
}

/**
 * Create repository-specific mock methods for Prisma
 * 
 * @param mockPrisma The mocked Prisma client
 * @param modelName The name of the Prisma model (e.g., 'notification')
 * @param sampleData Sample data to return from mock methods
 */
export function mockPrismaModelMethods<T extends object>(
  mockPrisma: DeepMockProxy<PrismaClient>,
  modelName: string,
  sampleData: T
): void {
  // Make sure the model exists on the Prisma client
  if (!(modelName in mockPrisma)) {
    throw new Error(`Model "${modelName}" does not exist in Prisma client`);
  }

  // Cast the model to any to allow method mocking
  const model = mockPrisma[modelName as keyof typeof mockPrisma] as any;

  // Mock common methods with appropriate return values
  model.findMany.mockResolvedValue([sampleData]);
  model.findUnique.mockResolvedValue(sampleData);
  model.findFirst.mockResolvedValue(sampleData);
  model.create.mockResolvedValue(sampleData);
  model.update.mockResolvedValue(sampleData);
  model.delete.mockResolvedValue(sampleData);
  model.count.mockResolvedValue(1);
  model.updateMany.mockResolvedValue({ count: 1 });
  model.deleteMany.mockResolvedValue({ count: 1 });
  model.upsert.mockResolvedValue(sampleData);

  // Allow overriding these mocks in individual tests
  // e.g., mockPrisma.notification.findMany.mockResolvedValueOnce([])
}

/**
 * Create a mock transaction function for Prisma
 * 
 * @param mockPrisma The mocked Prisma client 
 */
export function mockPrismaTransaction(mockPrisma: DeepMockProxy<PrismaClient>): void {
  mockPrisma.$transaction.mockImplementation((operations) => {
    // If operations is a function, call it with the mock client
    if (typeof operations === 'function') {
      return Promise.resolve(operations(mockPrisma));
    }
    // If operations is an array of promises, resolve them all
    return Promise.all(operations);
  });
}

/**
 * Setup a complete Prisma mock for repository testing
 * 
 * @param modelName The name of the Prisma model
 * @param sampleData Sample data to use in mock responses
 * @returns A configured mock Prisma client
 */
export function setupRepositoryTest<T extends object>(
  modelName: string,
  sampleData: T
): DeepMockProxy<PrismaClient> {
  const mockPrisma = createMockPrismaClient();
  mockPrismaModelMethods(mockPrisma, modelName, sampleData);
  mockPrismaTransaction(mockPrisma);
  return mockPrisma;
}