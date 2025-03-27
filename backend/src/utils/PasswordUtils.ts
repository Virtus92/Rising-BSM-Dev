import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export class PasswordUtils {
  // List of commonly used passwords to check against
  private static commonPasswords: Set<string> = new Set();
  private static readonly MIN_LENGTH = 12; // NIST recommends allowing up to 64 characters
  private static readonly MAX_LENGTH = 128;
  
  // Password strength scores
  private static readonly STRENGTH = {
    VERY_WEAK: 0,
    WEAK: 1,
    MEDIUM: 2,
    STRONG: 3,
    VERY_STRONG: 4
  };
  
  /**
   * Validate password against policy
   * 
   * @param password - The password to validate
   * @param username - Optional username to check against
   * @param email - Optional email to check against
   * @returns Object with validation result and any error messages
   */
  static validatePassword(
    password: string, 
    username?: string, 
    email?: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Length check
    if (!password || password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }
    
    if (password && password.length > this.MAX_LENGTH) {
      errors.push(`Password cannot exceed ${this.MAX_LENGTH} characters`);
    }
    
    // Check for common passwords
    if (this.commonPasswords.has(password.toLowerCase())) {
      errors.push('This password is too common and easily guessable');
    }
    
    // Check against username and email
    if (username && password.toLowerCase().includes(username.toLowerCase())) {
      errors.push('Password should not contain your username');
    }
    
    if (email) {
      const emailParts = email.split('@');
      if (emailParts[0] && password.toLowerCase().includes(emailParts[0].toLowerCase())) {
        errors.push('Password should not contain parts of your email address');
      }
    }
    
    // Check for sequential characters (like '12345' or 'abcde')
    if (/(?:([\d]{3,})|(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz))/i.test(password)) {
      errors.push('Password should not contain sequential characters');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Calculate password strength score
   * 
   * @param password - The password to evaluate
   * @returns Strength score between 0-4
   */
  static getPasswordStrength(password: string): number {
    let score = 0;
    
    // Length points (up to 2 points)
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety (up to 2 points)
    if (/[A-Z]/.test(password)) score += 0.5;
    if (/[a-z]/.test(password)) score += 0.5;
    if (/[0-9]/.test(password)) score += 0.5;
    if (/[^A-Za-z0-9]/.test(password)) score += 0.5;
    
    // Penalize for common patterns
    if (/(?:([\d]{3,})|(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz))/i.test(password)) {
      score -= 1;
    }
    
    // Normalize and round the score
    const finalScore = Math.max(0, Math.min(4, Math.round(score)));
    return finalScore;
  }
  
  /**
   * Hash a password with bcrypt
   * 
   * @param password - Plain text password
   * @returns Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12; // Higher rounds = more secure but slower
    return bcrypt.hash(password, saltRounds);
  }
  
  /**
   * Verify a password against a hash
   * 
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns Whether password matches hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}