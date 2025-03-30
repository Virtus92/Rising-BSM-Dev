/**
 * Helper utilities for creating type-safe Jest mocks
 */
import { jest } from '@jest/globals';

/**
 * Creates a typed mock function that can be used with Jest
 * @returns A properly typed Jest mock function
 */
export function createMockFunction<T extends (...args: any[]) => any>() {
  return jest.fn() as jest.MockedFunction<T>;
}

/**
 * Creates typed mock objects that contain mock functions
 * @returns A properly typed mock object with Jest mock functions
 */
export function createMockObject<T>(): { [K in keyof T]: T[K] extends (...args: any[]) => any ? jest.MockedFunction<T[K]> : T[K] } {
  return new Proxy({} as any, {
    get: (target, prop) => {
      if (!(prop in target)) {
        target[prop] = jest.fn();
      }
      return target[prop];
    }
  });
}
