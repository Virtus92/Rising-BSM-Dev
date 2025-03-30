/**
 * CryptoHelper Mock
 * 
 * Mock implementation of the CryptoHelper for testing.
 * This allows us to control crypto operations in tests.
 */

import { jest } from '@jest/globals';
import { PasswordUtils } from './test-utils.js';

// Mock CryptoHelper implementation
const CryptoHelperMock = {
  // Password hashing and verification
  hashPassword: jest.fn<Promise<string>, [string]>().mockImplementation(async (password: string) => {
    // Return known hash for testing password
    if (password === PasswordUtils.KNOWN_PASSWORD) {
      return PasswordUtils.KNOWN_PASSWORD_HASH;
    }
    
    // Otherwise, return a deterministic "hash" for testing
    return `hashed_${password}`;
  }),
  
  verifyPassword: jest.fn<Promise<boolean>, [string, string]>().mockImplementation(async (password: string, hash: string) => {
    // Handle known password/hash combination
    if (hash === PasswordUtils.KNOWN_PASSWORD_HASH) {
      return password === PasswordUtils.KNOWN_PASSWORD;
    }
    
    // Otherwise, use a simple deterministic verification for testing
    return hash === `hashed_${password}`;
  }),
  
  // Token generation and validation
  generateRandomToken: jest.fn<string, []>().mockReturnValue('test-random-token'),
  
  hashToken: jest.fn<string, [string]>().mockImplementation((token: string) => {
    return `hashed_token_${token}`;
  }),
  
  // JWT token generation
  generateJwtToken: jest.fn<string, [any, any]>().mockImplementation((payload: any, options: any) => {
    return `jwt_token_${JSON.stringify(payload)}_${JSON.stringify(options)}`;
  }),
  
  // Date calculation
  calculateExpirationDate: jest.fn<Date, [string]>().mockImplementation((timeString: string) => {
    const now = new Date();
    
    // Parse simple time strings for testing
    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24h
    }
    
    const [, value, unit] = match;
    const numValue = parseInt(value, 10);
    
    switch(unit) {
      case 's': return new Date(now.getTime() + numValue * 1000);
      case 'm': return new Date(now.getTime() + numValue * 60 * 1000);
      case 'h': return new Date(now.getTime() + numValue * 60 * 60 * 1000);
      case 'd': return new Date(now.getTime() + numValue * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }),
  
  // Reset all mocks
  resetMocks() {
    this.hashPassword.mockClear();
    this.verifyPassword.mockClear();
    this.generateRandomToken.mockClear();
    this.hashToken.mockClear();
    this.generateJwtToken.mockClear();
    this.calculateExpirationDate.mockClear();
  }
};

export default CryptoHelperMock;

// Setup jest.mock to replace the real CryptoHelper with our mock
jest.mock('../../src/utils/crypto-helper.js', () => ({
  CryptoHelper: CryptoHelperMock
}));
