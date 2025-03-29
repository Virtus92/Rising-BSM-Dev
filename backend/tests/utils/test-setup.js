/**
 * Jest test setup
 * Runs before each test file
 */

// Set default timeout for all tests
jest.setTimeout(30000);

// Configure console output to be cleaner in tests
global.console = {
  ...console,
  // Keep error output for debugging
  error: jest.fn(console.error),
  // Silence info logs during tests
  info: jest.fn(),
  // Silence debug logs during tests
  debug: jest.fn(),
  // Keep warnings but format them nicely
  warn: jest.fn((...args) => console.error('\x1b[33m%s\x1b[0m', '[WARNING]', ...args)),
  // Keep log for explicit logging needs
  log: console.log
};

// Clean up all mock implementations after each test
afterEach(() => {
  jest.clearAllMocks();
});
