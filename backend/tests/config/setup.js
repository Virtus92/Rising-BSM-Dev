// Global Jest setup for backend tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DB_DATABASE = 'rising_bsm_test';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.LOG_LEVEL = 'error'; // Minimize logging during tests

// Global mock setup
jest.mock('../../src/utils/crypto-helper.js', () => {
  return {
    CryptoHelper: {
      hashPassword: jest.fn().mockImplementation(async (password) => `hashed_${password}`),
      verifyPassword: jest.fn().mockImplementation(async (password, hash) => 
        hash === `hashed_${password}` || hash === password),
      generateRandomToken: jest.fn().mockReturnValue('test-token-12345'),
      hashToken: jest.fn().mockImplementation((token) => `hashed_${token}`),
      calculateExpirationDate: jest.fn().mockImplementation(() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date;
      }),
      generateJwtToken: jest.fn().mockReturnValue('mock-jwt-token')
    }
  };
});

// Global afterAll hook to ensure proper cleanup
afterAll(async () => {
  // Add any global cleanup needed
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure connections close
});
