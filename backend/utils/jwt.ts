import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors';

export interface TokenPayload {
  userId: number;
  role: string;
  email?: string;
  name?: string;
}

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
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

/**
 * Verify and decode JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    return jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
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
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify refresh token
 * @param token Refresh token to verify
 * @returns User ID from token
 */
export const verifyRefreshToken = (token: string): number => {
  try {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as { userId: number };
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
  
  // Calculate expiration time in seconds
  const expiresIn = parseInt(
    process.env.JWT_EXPIRES_IN?.replace(/\D/g, '') || '3600',
    10
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn
  };
};