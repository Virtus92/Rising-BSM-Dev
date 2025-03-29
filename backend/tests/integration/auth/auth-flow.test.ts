import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { 
  getTestPrismaClient, 
  cleanTestDatabase, 
  closeTestDatabase 
} from '../../utils/test-database.js';
import { getTestServer, closeTestServer } from '../../utils/test-server.js';
import { setupTestEnvironment } from '../../utils/test-helpers.js';
import { UserStatus } from '../../../src/entities/User.js';

/**
 * Integration test for the complete authentication flow
 * Tests the interactions between controllers, services, and repositories
 */

// Use a specific user for this test
const testUserEmail = 'auth-flow-test@example.com';
const testUserPassword = 'AuthFlowTest123!';
const testUserName = 'Auth Flow Test User';

// Global variables to store tokens
let accessToken: string;
let refreshToken: string;
let resetToken: string;
let app: any;
let prisma: PrismaClient;
let userId: number;

// Setup test environment
beforeAll(async () => {
  setupTestEnvironment();
  
  // Get server and database instances
  app = await getTestServer();
  prisma = await getTestPrismaClient();
  
  // Clean database
  await cleanTestDatabase();
  
  // Create test user
  const hashedPassword = await bcrypt.hash(testUserPassword, 10);
  const user = await prisma.user.create({
    data: {
      name: testUserName,
      email: testUserEmail,
      password: hashedPassword,
      role: 'employee',
      status: UserStatus.ACTIVE
    }
  });
  
  userId = user.id;
  
  console.log(`Created test user with ID ${userId}`);
}, 30000);

// Cleanup
afterAll(async () => {
  // Clean up
  await cleanTestDatabase();
  await closeTestDatabase();
  await closeTestServer();
}, 10000);

describe('Authentication Flow', () => {
  it('Step 1: User login with valid credentials', async () => {
    const response = await request(app)
      .post('/API/v1/login')
      .send({
        email: testUserEmail,
        password: testUserPassword
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    
    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
    
    // Verify JWT format
    expect(accessToken).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/);
    
    // Verify refresh token is stored in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });
    
    expect(storedToken).toBeDefined();
    expect(storedToken?.userId).toBe(userId);
    expect(storedToken?.isRevoked).toBe(false);
  });
  
  it('Step 2: Login should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/API/v1/login')
      .send({
        email: testUserEmail,
        password: 'WrongPassword123!'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
  
  it('Step 3: Access protected resource with valid token', async () => {
    const response = await request(app)
      .get('/API/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(testUserEmail);
  });
  
  it('Step 4: Refresh token', async () => {
    // Pause for a second to ensure tokens are different
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await request(app)
      .post('/API/v1/auth/refresh-token')
      .send({
        refreshToken: refreshToken
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    
    const oldAccessToken = accessToken;
    const oldRefreshToken = refreshToken;
    
    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
    
    // Verify that new tokens are different from old ones
    expect(accessToken).not.toBe(oldAccessToken);
    expect(refreshToken).not.toBe(oldRefreshToken);
    
    // Verify that the old refresh token is now revoked
    const oldToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken }
    });
    
    expect(oldToken?.isRevoked).toBe(true);
    expect(oldToken?.replacedByToken).toBe(refreshToken);
    
    // Verify that the new refresh token exists
    const newToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });
    
    expect(newToken).toBeDefined();
    expect(newToken?.isRevoked).toBe(false);
  });
  
  it('Step 5: Request password reset', async () => {
    const response = await request(app)
      .post('/API/v1/auth/forgot-password')
      .send({
        email: testUserEmail
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // In test environment, get the reset token from database
    const user = await prisma.user.findUnique({
      where: { email: testUserEmail },
      select: { resetToken: true }
    });
    
    expect(user?.resetToken).toBeDefined();
    resetToken = user?.resetToken || '';
  });
  
  it('Step 6: Validate reset token', async () => {
    const response = await request(app)
      .get(`/API/v1/auth/reset-token/${resetToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.valid).toBe(true);
  });
  
  it('Step 7: Reset password', async () => {
    const newPassword = 'NewPassword123!';
    
    const response = await request(app)
      .post(`/API/v1/auth/reset-password/${resetToken}`)
      .send({
        password: newPassword,
        confirmPassword: newPassword
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verify that the reset token is cleared
    const user = await prisma.user.findUnique({
      where: { email: testUserEmail },
      select: { resetToken: true, resetTokenExpiry: true }
    });
    
    expect(user?.resetToken).toBeNull();
    expect(user?.resetTokenExpiry).toBeNull();
    
    // Verify all refresh tokens are revoked
    const tokens = await prisma.refreshToken.findMany({
      where: { userId: userId }
    });
    
    tokens.forEach(token => {
      expect(token.isRevoked).toBe(true);
    });
    
    // Verify can login with new password
    const loginResponse = await request(app)
      .post('/API/v1/login')
      .send({
        email: testUserEmail,
        password: newPassword
      });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    
    // Update access token for next test
    accessToken = loginResponse.body.data.accessToken;
    refreshToken = loginResponse.body.data.refreshToken;
  });
  
  it('Step 8: Logout', async () => {
    const response = await request(app)
      .post('/API/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        refreshToken: refreshToken
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verify the refresh token is revoked
    const token = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });
    
    expect(token?.isRevoked).toBe(true);
    
    // Verify refresh token endpoint fails with revoked token
    const refreshResponse = await request(app)
      .post('/API/v1/auth/refresh-token')
      .send({
        refreshToken: refreshToken
      });
    
    expect(refreshResponse.status).toBe(401);
  });
});
