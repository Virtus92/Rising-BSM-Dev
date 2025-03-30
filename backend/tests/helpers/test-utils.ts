/**
 * Test Utilities
 * 
 * Common utilities for test setup and assertions.
 */

import jwt from 'jsonwebtoken';
import { User } from '../../src/entities/User.js';
import { createMockUser } from './mock-factory.js';

/**
 * JWT token generation for testing
 */
export const TokenUtils = {
  /**
   * Generate a test JWT token with a specified payload
   */
  generateAccessToken(user: User = createMockUser(), expiresIn: string = '15m'): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret', { expiresIn });
  },
  
  /**
   * Generate an expired JWT token for testing
   */
  generateExpiredToken(user: User = createMockUser()): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
      exp: Math.floor(Date.now() / 1000) - 1800  // 30 minutes in the past
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret', { 
      algorithm: 'HS256',
      expiresIn: '-30m' // Expired 30 minutes ago
    });
  },
  
  /**
   * Decode and verify a JWT token
   */
  decodeToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret');
  }
};

/**
 * Time manipulation utilities for testing
 */
export const TimeUtils = {
  /**
   * Mock the current date/time
   */
  mockDate(date: Date): jest.SpyInstance {
    const originalDate = global.Date;
    
    // @ts-ignore - TS doesn't like us messing with Date
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          return new originalDate(date);
        }
        // @ts-ignore
        return new originalDate(...args);
      }
      
      static now() {
        return date.getTime();
      }
    };
    
    return jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
      if (args.length === 0) {
        return new originalDate(date);
      }
      return new originalDate(...args);
    });
  },
  
  /**
   * Restore the original Date implementation
   */
  restoreDate(mockDate?: jest.SpyInstance): void {
    if (mockDate) {
      mockDate.mockRestore();
    }
  }
};

/**
 * Password utilities for testing
 */
export const PasswordUtils = {
  /**
   * Known password hash for testing
   * 
   * This is a hashed version of 'password123' that can be used in tests
   * where we need a known password hash to test with.
   */
  KNOWN_PASSWORD_HASH: '$2b$10$X/2L2L8iYmEVVQs0TNKRNurNxIxmfc6iMnA04zcZP8qkRYsAVQ.wa',
  
  /**
   * The original plain text password that hashes to KNOWN_PASSWORD_HASH
   */
  KNOWN_PASSWORD: 'password123'
};
