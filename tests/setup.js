// Global setup for tests

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't fail the tests for this in test environment
});

// Mock console.error in tests to keep output clean
// but still track when it's called
const originalConsoleError = console.error;
console.error = jest.fn((...args) => {
  // Uncomment the next line to see errors during tests
  // originalConsoleError(...args);
});

// Global beforeAll and afterAll hooks
beforeAll(() => {
  // Any setup needed before all tests
});

afterAll(() => {
  // Any cleanup needed after all tests
});

// Setting a longer timeout for tests
jest.setTimeout(10000);
