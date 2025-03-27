import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * CryptoHelper
 * 
 * Utility class for cryptographic operations.
 * Provides standardized functions for hashing, token generation, etc.
 */
export class CryptoHelper {
  /**
   * Hash a password
   * 
   * @param password - Plain text password
   * @param saltRounds - Number of salt rounds (default: 10)
   * @returns Promise with hashed password
   */
  static async hashPassword(password: string, saltRounds: number = 10): Promise<string> {
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password
   * 
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password
   * @returns Promise with boolean indicating whether password is valid
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate a JWT token
   * 
   * @param payload - Token payload
   * @param options - JWT options
   * @returns Signed JWT token
   */
  static generateJwtToken(
    payload: Record<string, any>,
    options: { 
      expiresIn: string, 
      secret?: string 
    } = { expiresIn: config.JWT_EXPIRES_IN }
  ): string {
    const secret = options.secret || config.JWT_SECRET;
    return jwt.sign(payload, secret, { expiresIn: options.expiresIn } as jwt.SignOptions);
  }

  /**
   * Verify a JWT token
   * 
   * @param token - JWT token
   * @param secret - Secret key (default: from config)
   * @returns Decoded token payload
   * @throws Error if token is invalid
   */
  static verifyJwtToken(token: string, secret: string = config.JWT_SECRET): any {
    return jwt.verify(token, secret);
  }

  /**
   * Generate a random token
   * 
   * @param length - Token length in bytes (default: 32)
   * @returns Random token as hex string
   */
  static generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a token using SHA-256
   * 
   * @param token - Token to hash
   * @returns Hashed token
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Calculate token expiration date
   * 
   * @param expiresIn - Expiration string (e.g., '7d', '24h')
   * @returns Expiration date
   */
  static calculateExpirationDate(expiresIn: string): Date {
    const unit = expiresIn.charAt(expiresIn.length - 1);
    const value = parseInt(expiresIn.substring(0, expiresIn.length - 1), 10);
    const now = new Date();
    
    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default: 1 day
    }
  }
}

export default CryptoHelper;