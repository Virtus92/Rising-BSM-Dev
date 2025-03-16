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
  originalConsoleError(...args);
});

// Global beforeAll and afterAll hooks
beforeAll(() => {
  // Any setup needed before all tests
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.CONTACT_EMAIL = 'test@example.com';
});

afterAll(() => {
  // Any cleanup needed after all tests
});

// Setting a longer timeout for tests
jest.setTimeout(10000);

// Common mock implementations
const mockRequest = () => {
  const req = {};
  req.body = jest.fn().mockReturnValue(req);
  req.params = jest.fn().mockReturnValue(req);
  req.query = jest.fn().mockReturnValue(req);
  req.session = {};
  req.flash = jest.fn();
  req.get = jest.fn();
  return req;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

// DB Mocks
// First, declare mockDbClient without defining it
const mockDbClient = {
  query: jest.fn(),
  connect: jest.fn(),
  release: jest.fn(),
  on: jest.fn(),
  transaction: jest.fn().mockImplementation(callback => callback(mockDbClient)),
  getById: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  pool: {
    end: jest.fn()
  }
};

// Common service mocks
jest.mock('../services/notification.service', () => ({
  create: jest.fn(),
  getUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
  delete: jest.fn()
}));

jest.mock('../services/mail.service', () => ({
  sendMail: jest.fn().mockResolvedValue(true),
  createMailOptions: jest.fn()
}));

jest.mock('../services/cache.service', () => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  getOrExecute: jest.fn()
}));

jest.mock('../utils/validators', () => ({
  validateInput: jest.fn().mockReturnValue({ isValid: true, errors: {} }),
  validateEmail: jest.fn().mockReturnValue(true),
  validatePassword: jest.fn().mockReturnValue(true)
}));

// Auth related mocks
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com' })
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

// Common mock for db.service
jest.mock('../services/db.service', () => {
  return {
    query: mockDbClient.query,
    transaction: mockDbClient.transaction,
    getById: mockDbClient.getById,
    insert: mockDbClient.insert,
    update: mockDbClient.update,
    delete: mockDbClient.delete,
    pool: mockDbClient.pool
  };
});

// Export common mocks and helpers
module.exports = {
  mockRequest,
  mockResponse,
  mockDbClient
};
