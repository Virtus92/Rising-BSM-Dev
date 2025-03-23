import { jest } from '@jest/globals';

/**
 * Creates a properly typed mock function that can be safely used with mockResolvedValue and mockRejectedValue
 * 
 * @example
 * // For a function that returns a User object
 * const mockUserFn = createTypedMock<typeof User>();
 */
export function createTypedMock<T = any>() {
  return jest.fn().mockImplementation(() => Promise.resolve()) as unknown as jest.Mock<() => Promise<T>> & {
    mockResolvedValue: (value: T) => jest.Mock<() => Promise<T>>;
    mockRejectedValue: (err: Error) => jest.Mock<() => Promise<T>>;
  };
}

/**
 * Creates an async mock function that returns the given value
 */
export function mockResolvedValueOnce<T>(value: T) {
  return jest.fn().mockImplementation(() => Promise.resolve(value)) as unknown as jest.Mock<() => Promise<T>>;
}

/**
 * Creates an async mock function that returns the given values in sequence
 */
export function mockResolvedValues<T>(...values: T[]) {
  const mock = jest.fn();
  values.forEach(value => {
    mock.mockImplementationOnce(() => Promise.resolve(value));
  });
  return mock as unknown as jest.Mock<() => Promise<T>>;
}
  
/**
 * Creates a synchronous mock function that returns the given value
 */
export function mockReturnValue<T>(value: T) {
  return jest.fn().mockReturnValue(value) as unknown as jest.Mock<() => T>;
}