import 'jest';
import { Mock } from 'jest-mock';

// Add missing custom jest type extensions
declare global {
  namespace jest {
    // Simplify mocking with these helper types
    interface MockHelpers {
      // Helper type to create a mock function that returns a value of type T
      MockReturnType<T> = {
        mockResolvedValue: (value: T) => Mock<Promise<T>>;
        mockRejectedValue: (error: Error) => Mock<Promise<T>>;
        mockReturnValue: (value: T) => Mock<() => T>;
        mockImplementation: <TArgs extends any[]>(fn: (...args: TArgs) => T) => Mock<(...args: TArgs) => T>;
      };
    }
  }
}

// This is a workaround for typing mock functions
export type SafeMock<T = any> = jest.Mock<any, any> & {
  mockResolvedValue: (value: T) => jest.Mock<Promise<T>>;
  mockRejectedValue: (value: any) => jest.Mock<Promise<T>>;
  mockReturnValue: (value: T) => jest.Mock<() => T>;
  mockImplementation: <TArgs extends any[]>(fn: (...args: TArgs) => T) => jest.Mock<(...args: TArgs) => T>;
};