import jwt from 'jsonwebtoken';
import { 
  generateToken, 
  verifyToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  generateAuthTokens,
  extractTokenFromHeader
} from '../../../utils/jwt';
import { UnauthorizedError } from '../../../utils/errors';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  JsonWebTokenError: class JsonWebTokenError extends Error {},
  TokenExpiredError: class TokenExpiredError extends Error {
    constructor(message: string, expiredAt: Date) {
      super(message);
      this.expiredAt = expiredAt;
    }
    expiredAt: Date;
  }
}));

describe('JWT Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const payload = { userId: 1, role: 'admin' };
      (jwt.sign as jest.Mock).mockReturnValue('generated-token');
      
      const token = generateToken(payload);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(token).toBe('generated-token');
    });
  });
  
  describe('verifyToken', () => {
    test('should verify and return payload for valid token', () => {
      const payload = { userId: 1, role: 'admin' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      
      const result = verifyToken('valid-token');
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(result).toEqual(payload);
    });
    
    test('should throw UnauthorizedError for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });
      
      expect(() => verifyToken('invalid-token')).toThrow(UnauthorizedError);
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });
    
    test('should throw UnauthorizedError for expired token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('expired token', new Date());
      });
      
      expect(() => verifyToken('expired-token')).toThrow(UnauthorizedError);
      expect(() => verifyToken('expired-token')).toThrow('Token expired');
    });
  });
  
  describe('extractTokenFromHeader', () => {
    test('should extract token from valid Authorization header', () => {
      const token = extractTokenFromHeader('Bearer valid-token');
      expect(token).toBe('valid-token');
    });
    
    test('should return null for missing Authorization header', () => {
      const token = extractTokenFromHeader(undefined);
      expect(token).toBeNull();
    });
    
    test('should return null for invalid Authorization format', () => {
      const token = extractTokenFromHeader('invalid-format');
      expect(token).toBeNull();
    });
  });
  
  describe('generateRefreshToken', () => {
    test('should generate a refresh token with userId', () => {
      (jwt.sign as jest.Mock).mockReturnValue('refresh-token');
      
      const token = generateRefreshToken(1);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1 },
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(token).toBe('refresh-token');
    });
  });
  
  describe('verifyRefreshToken', () => {
    test('should verify and return userId from valid refresh token', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
      
      const userId = verifyRefreshToken('valid-refresh-token');
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(String));
      expect(userId).toBe(1);
    });
    
    test('should throw UnauthorizedError for invalid refresh token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });
      
      expect(() => verifyRefreshToken('invalid-token')).toThrow(UnauthorizedError);
      expect(() => verifyRefreshToken('invalid-token')).toThrow('Invalid refresh token');
    });
  });
  
  describe('generateAuthTokens', () => {
    test('should generate both access and refresh tokens', () => {
      const payload = { userId: 1, role: 'admin' };
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      
      const result = generateAuthTokens(payload);
      
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: expect.any(Number)
      });
    });
  });
});