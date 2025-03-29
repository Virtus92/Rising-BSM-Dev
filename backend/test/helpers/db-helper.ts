import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Create a singleton PrismaClient instance
const prisma = new PrismaClient();

/**
 * Helper class for database operations in tests
 */
export class DbHelper {
  /**
   * Clean up all test data from the database
   */
  static async cleanDb(): Promise<void> {
    // Delete in reverse order of dependencies
    await prisma.refreshToken.deleteMany({});
    await prisma.userActivity.deleteMany({});
    await prisma.userSettings.deleteMany({});
    await prisma.user.deleteMany({});
  }

  /**
   * Create a test user
   * 
   * @param options - User options
   * @returns Created user
   */
  static async createTestUser(options: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    status?: string;
  } = {}) {
    const hashedPassword = await bcrypt.hash(options.password || 'Password123!', 10);
    
    return prisma.user.create({
      data: {
        name: options.name || 'Test User',
        email: options.email || `testuser-${Date.now()}@example.com`,
        password: hashedPassword,
        role: options.role || 'mitarbeiter',
        status: options.status || 'aktiv',
      },
    });
  }
  
  /**
   * Create a refresh token for a user
   * 
   * @param userId - User ID
   * @param options - Token options
   * @returns Created token
   */
  static async createRefreshToken(userId: number, options: {
    expiresIn?: string;
    isRevoked?: boolean;
  } = {}) {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    
    // Add days to expiration (default: 7 days)
    const days = options.expiresIn ? parseInt(options.expiresIn) : 7;
    expiresAt.setDate(expiresAt.getDate() + days);
    
    return prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        createdAt: new Date(),
        createdByIp: '127.0.0.1',
        isRevoked: options.isRevoked || false,
      },
    });
  }
  
  /**
   * Create a password reset token for a user
   * 
   * @param userId - User ID
   * @param options - Token options
   * @returns Raw token and hashed token
   */
  static async createResetToken(userId: number, options: {
    expiryHours?: number;
  } = {}) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
      
    const expiryHours = options.expiryHours || 24;
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + expiryHours);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });
    
    return {
      rawToken,
      hashedToken,
      resetTokenExpiry,
    };
  }
}

export default DbHelper;