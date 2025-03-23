import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors.js';

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN;

// Check for missing environment variables
if (!JWT_SECRET || !JWT_EXPIRES_IN || !JWT_REFRESH_SECRET || !JWT_REFRESH_EXPIRES_IN) {
  throw new Error('Required JWT environment variables are missing. Please set JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, and JWT_REFRESH_EXPIRES_IN');
}

/**
 * User payload structure for JWT tokens
 */
export interface TokenPayload {
  userId: number;
  role: string;
  email?: string;
  name?: string;
}

/**
 * Response structure for token generation
 */
export interface TokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate JWT access token
 * @param payload User information to encode in token
 * @returns JWT token string
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

/**
 * Verify and decode JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload
 * @throws UnauthorizedError if token is invalid or expired
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    } else {
      throw error;
    }
  }
};

/**
 * Generate refresh token
 * @param userId User ID to encode in token
 * @returns Refresh token string
 */
export const generateRefreshToken = (userId: number): string => {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
};

/**
 * Verify refresh token
 * @param token Refresh token to verify
 * @returns User ID from token
 * @throws UnauthorizedError if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): number => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: number };
    return decoded.userId;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired');
    } else {
      throw error;
    }
  }
};

/**
 * Generate both access and refresh tokens
 * @param payload User information for tokens
 * @returns Object containing both tokens and expiration
 */
export const generateAuthTokens = (payload: TokenPayload): TokenResult => {
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload.userId);
  
  // Parse expiration time from JWT_EXPIRES_IN
  let expiresIn = 3600; // Default to 1 hour in seconds
  
  const expiresMatch = JWT_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (expiresMatch) {
    const value = parseInt(expiresMatch[1]);
    const unit = expiresMatch[2];
    
    switch (unit) {
      case 's': expiresIn = value; break;
      case 'm': expiresIn = value * 60; break;
      case 'h': expiresIn = value * 60 * 60; break;
      case 'd': expiresIn = value * 24 * 60 * 60; break;
    }
  }
  
  return {
    accessToken,
    refreshToken,
    expiresIn
  };
};

/**
 * Extract token from authorization header
 * @param authHeader Authorization header value
 * @returns Token or null if not found
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  // Check for Bearer token format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};