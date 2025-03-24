/**
 * Security Utilities
 * 
 * Utilities for authentication, authorization, and security-related operations.
 * Includes JWT functions, token handling, and secure password operations.
 */
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './error.utils.js';
import { logger } from './common.utils.js';
import bcrypt from 'bcryptjs'; // Changed from bcrypt to bcryptjs
import config from '../config/index.js';

// JWT configuration
const JWT_SECRET = config.JWT_SECRET;
const JWT_EXPIRES_IN = config.JWT_EXPIRES_IN;
const JWT_REFRESH_SECRET = config.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = config.JWT_REFRESH_EXPIRES_IN;
const JWT_REFRESH_TOKEN_ROTATION = config.JWT_REFRESH_TOKEN_ROTATION;

// Warn if using default secrets in production
if (config.IS_PRODUCTION) {
  if (JWT_SECRET === 'your-default-super-secret-key-change-in-production' || 
      JWT_REFRESH_SECRET === 'your-refresh-default-key-change-in-production') {
    logger.error('SECURITY WARNING: Using default JWT secrets in production environment!');
  }
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
 * Decoded refresh token payload
 */
export interface RefreshTokenPayload {
  userId: number;
  tokenId?: string;
  exp?: number;
  iat?: number;
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
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
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
 * Generate refresh token with optional token ID
 * @param userId User ID to encode in token
 * @param tokenId Optional unique token ID for rotation
 * @returns Refresh token string
 */
export const generateRefreshToken = (userId: number, tokenId?: string): string => {
  const payload: any = { userId };
  
  // Add token ID if provided (used for token rotation)
  if (tokenId) {
    payload.tokenId = tokenId;
  }
  
  return jwt.sign(
    payload,
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
};

/**
 * Verify refresh token
 * @param token Refresh token to verify
 * @returns Decoded refresh token payload
 * @throws UnauthorizedError if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
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
 * @param tokenId Optional unique ID for refresh token
 * @returns Object containing both tokens and expiration
 */
export const generateAuthTokens = (payload: TokenPayload, tokenId?: string): TokenResult => {
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload.userId, tokenId);
  
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

/**
 * Hash a password using bcrypt
 * @param password Plain text password to hash
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare a password with its hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns Whether the password matches the hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a secure random token (for password reset, etc.)
 * @param length Length of the token
 * @returns Random secure token
 */
export const generateSecureToken = (length: number = 32): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Calculate hash for a value (for verification codes, etc.)
 * @param value Value to hash
 * @returns Hash of the value
 */
export const calculateHash = (value: string): string => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(value).digest('hex');
};

/**
 * Check if token rotation is enabled
 * @returns Whether token rotation is enabled
 */
export const isTokenRotationEnabled = (): boolean => {
  return JWT_REFRESH_TOKEN_ROTATION;
};