// Domain test setup - minimal environment for pure business logic

// Environment variables for domain tests
process.env.NODE_ENV = 'test';

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});