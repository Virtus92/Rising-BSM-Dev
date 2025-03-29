/**
 * Authentication Utilities for Testing
 * 
 * This file contains utilities for authentication in tests.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { CryptoHelper } from '../../src/utils/crypto-helper.js';

/**
 * Test user credentials
 */
export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  id?: number;
}

/**
 * Create a test user and return credentials
 * @param prisma - Prisma client instance
 * @param userData - User data (optional, defaults provided)
 * @returns Created user with credentials
 */
export async function createTestUser(
  prisma: PrismaClient,
  userData: Partial<TestUser> = {}
): Promise<TestUser> {
  const defaultUser = {
    email: `testuser-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'employee' as const
  };

  const user = { ...defaultUser, ...userData };
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const createdUser = await prisma.user.create({
    data: {
      name: user.name,
      email: user.email,
      password: hashedPassword,
      role: user.role,
      status: 'active'
    }
  });

  return {
    ...user,
    id: createdUser.id
  };
}

/**
 * Login test user and get auth tokens
 * @param app - Express app instance
 * @param credentials - Test user credentials
 * @returns Auth tokens and user data
 */
export async function loginTestUser(
  app: any,
  credentials: { email: string; password: string }
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
}> {
  const response = await request(app)
    .post('/API/v1/login')
    .send(credentials);

  if (response.status !== 200 || !response.body.success) {
    console.error('Login failed:', response.body);
    throw new Error(`Login failed with status ${response.status}`);
  }

  return {
    accessToken: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
    user: response.body.data.user
  };
}

/**
 * Generate auth tokens directly (bypassing login)
 * @param userId - User ID
 * @param role - User role
 * @param email - User email
 * @returns Generated tokens
 */
export function generateAuthTokens(
  userId: number,
  role: string = 'employee',
  email: string = 'test@example.com'
): {
  accessToken: string;
  refreshToken: string;
} {
  // Create payload for access token
  const accessTokenPayload = {
    sub: userId,
    email,
    role,
    type: 'access'
  };

  // Generate access token
  const accessToken = jwt.sign(
    accessTokenPayload,
    process.env.JWT_SECRET || 'test-secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    }
  );

  // Generate refresh token
  const refreshToken = CryptoHelper.generateRandomToken();

  return {
    accessToken,
    refreshToken
  };
}

/**
 * Setup auth tokens for a test user in the database
 * @param prisma - Prisma client instance
 * @param userId - User ID
 * @param ipAddress - IP address (optional)
 * @returns Auth tokens
 */
export async function setupAuthTokens(
  prisma: PrismaClient,
  userId: number,
  ipAddress: string = '127.0.0.1'
): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Generate tokens
  const tokens = generateAuthTokens(userId, user.role, user.email);

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId,
      expiresAt,
      createdByIp: ipAddress,
      createdAt: new Date(),
      isRevoked: false
    }
  });

  return tokens;
}

/**
 * Refresh an access token
 * @param app - Express app instance
 * @param refreshToken - Current refresh token
 * @returns New tokens
 */
export async function refreshAccessToken(
  app: any,
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const response = await request(app)
    .post('/API/v1/auth/refresh-token')
    .send({ refreshToken });

  if (response.status !== 200) {
    throw new Error(`Token refresh failed with status ${response.status}`);
  }

  return {
    accessToken: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken
  };
}

/**
 * Logout a user
 * @param app - Express app instance
 * @param accessToken - Access token
 * @param refreshToken - Refresh token
 * @returns Success status
 */
export async function logoutTestUser(
  app: any,
  accessToken: string,
  refreshToken: string
): Promise<boolean> {
  const response = await request(app)
    .post('/API/v1/auth/logout')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ refreshToken });

  return response.status === 200;
}
