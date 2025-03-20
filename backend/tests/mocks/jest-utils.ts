// tests/mocks/jest-utils.ts
import { jest } from '@jest/globals';

/**
 * Create a typed mock function that can be used with TypeScript
 * @returns A typed mock function that can be used with mockResolvedValue, etc.
 */
export function createMockFn<T = any>() {
  return jest.fn() as jest.Mock<any> & {
    mockResolvedValue: (value: T) => jest.Mock;
    mockRejectedValue: (error: any) => jest.Mock;
    mockReturnValue: (value: T) => jest.Mock;
    mockImplementation: (fn: (...args: any[]) => T) => jest.Mock;
  };
}

/**
 * Create a safely typed mock for Prisma methods
 */
export function createPrismaMock<T = any>() {
  return {
    findUnique: createMockFn<T>(),
    findMany: createMockFn<T[]>(),
    findFirst: createMockFn<T | null>(),
    create: createMockFn<T>(),
    update: createMockFn<T>(),
    delete: createMockFn<T>(),
    count: createMockFn<number>(),
    updateMany: createMockFn<{count: number}>(),
    deleteMany: createMockFn<{count: number}>()
  };
}