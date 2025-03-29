/**
 * Integration Tests - Authentication Flow
 * 
 * Tests the complete authentication flow:
 * - Login
 * - Access protected resources
 * - Token refresh
 * - Password reset
 * - Logout
 */
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import createTestApp from '../utils/test-app.js';
import { 
  setupTestEnvironment, 
  createTestUser,
  wait 
} from '../utils/test-helpers.js';

// Create a dedicated database for these tests
let prisma: PrismaClient;
let app: any;
let server: any;

// Test data
const testUser = {
  email: 'integration-test@example.com',
  password: 'IntegrationTest123!',
  name: 'Integration Test User',
  role: 'employee'
};

let userId: number;
let accessToken: string;
let refreshToken: string;
let resetToken: string;

// Setup before all tests
beforeAll(async () => {
  // Set up the test environment
  setupTestEnvironment();
  
  try {
    console.log('🔧 Setting up authentication flow integration test...');
    
    // Create a new Prisma client
    prisma = new PrismaClient();
    
    // Reset test data
    await prisma.userActivity.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
    
    // Create test user
    const user = await createTestUser(prisma, testUser);
    userId = user.id;
    
    // Initialize Express app
    const result = await createTestApp();
    app = result.app;
    server = result.server;
    
    console.log('✅ Auth flow integration test setup completed');
  } catch (error) {
    console.error('❌ Integration test setup failed:', error);
    throw error;
  }
}, 30000); // Longer timeout for setup

// Cleanup after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up integration test...');
  
  // Close server
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
  
  // Clean up test data
  await prisma.userActivity.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({
    where: { email: testUser.email }
  });
  
  // Disconnect Prisma client
  await prisma.$disconnect();
  
  console.log('✅ Integration test cleanup completed');
});

describe('Authentication Flow', () => {
  test('Step 1: User login', async () => {
    // Arrange & Act
    const response = await request(app)
      .post('/API/v1/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    
    // Store tokens for subsequent tests
    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
  });
  
  test('Step 2: Access protected resource', async () => {
    // Skip if login failed
    if (!accessToken) {
      console.warn('⚠️ Skipping test: No access token available');
      return;
    }

    // Arrange & Act
    const response = await request(app)
      .get('/API/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(userId);
    expect(response.body.data.email).toBe(testUser.email);
  });
  
  test('Step 3: Refresh token', async () => {
    // Skip if login failed
    if (!refreshToken) {
      console.warn('⚠️ Skipping test: No refresh token available');
      return;
    }

    // Arrange - Wait a moment to ensure different timestamps
    await wait(1000);
    
    // Act
    const response = await request(app)
      .post('/API/v1/auth/refresh-token')
      .send({ refreshToken });
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    
    // Store original token for comparison
    const oldAccessToken = accessToken;
    
    // Update tokens for subsequent tests
    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
    
    // Ensure new token is different from the old one
    expect(accessToken).not.toBe(oldAccessToken);
  });
  
  test('Step 4: Password forgot/reset flow', async () => {
    // Arrange & Act - Request password reset
    const forgotResponse = await request(app)
      .post('/API/v1/auth/forgot-password')
      .send({ email: testUser.email });
    
    // Assert
    expect(forgotResponse.status).toBe(200);
    expect(forgotResponse.body.success).toBe(true);
    
    // In test environment, get the reset token from the database
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: { resetToken: true, resetTokenExpiry: true }
    });
    
    // Ensure we have a reset token
    expect(user?.resetToken).toBeTruthy();
    resetToken = user?.resetToken || '';
    
    // Act - Validate token
    const validateResponse = await request(app)
      .get(`/API/v1/auth/reset-token/${resetToken}`);
    
    // Assert
    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.success).toBe(true);
    expect(validateResponse.body.data.valid).toBe(true);
    
    // Act - Reset password
    const resetResponse = await request(app)
      .post(`/API/v1/auth/reset-password/${resetToken}`)
      .send({
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      });
    
    // Assert
    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body.success).toBe(true);
    
    // Act - Login with new password
    const loginResponse = await request(app)
      .post('/API/v1/login')
      .send({
        email: testUser.email,
        password: 'NewPassword123!'
      });
    
    // Assert
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    
    // Update tokens for final test
    accessToken = loginResponse.body.data.accessToken;
    refreshToken = loginResponse.body.data.refreshToken;
  });
  
  test('Step 5: Logout', async () => {
    // Skip if login/reset failed
    if (!accessToken || !refreshToken) {
      console.warn('⚠️ Skipping test: No tokens available');
      return;
    }

    // Arrange & Act
    const response = await request(app)
      .post('/API/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Act - Verify refresh token no longer works
    const refreshResponse = await request(app)
      .post('/API/v1/auth/refresh-token')
      .send({ refreshToken });
    
    // Assert
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.success).toBe(false);
  });
});
