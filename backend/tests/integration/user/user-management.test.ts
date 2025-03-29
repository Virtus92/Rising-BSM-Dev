import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { 
  getTestPrismaClient, 
  cleanTestDatabase, 
  closeTestDatabase 
} from '../../utils/test-database.js';
import { getTestServer, closeTestServer } from '../../utils/test-server.js';
import { 
  setupTestEnvironment, 
  createTestAdmin,
  createTestUser,
  generateRandomEmail
} from '../../utils/test-helpers.js';
import { UserStatus } from '../../../src/entities/User.js';

/**
 * Integration test for user management operations
 * Tests the interactions between controllers, services, and repositories
 */

// Set up test credentials
const adminEmail = 'admin-test@example.com';
const adminPassword = 'AdminTest123!';
const adminName = 'Admin Test User';

// Global variables
let app: any;
let prisma: PrismaClient;
let adminId: number;
let adminToken: string;
let createdUserId: number;

// Setup test environment
beforeAll(async () => {
  setupTestEnvironment();
  
  // Get server and database instances
  app = await getTestServer();
  prisma = await getTestPrismaClient();
  
  // Clean database
  await cleanTestDatabase();
  
  // Create admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      status: UserStatus.ACTIVE
    }
  });
  
  adminId = admin.id;
  
  // Login admin to get token
  const response = await request(app)
    .post('/API/v1/login')
    .send({
      email: adminEmail,
      password: adminPassword
    });
  
  adminToken = response.body.data.accessToken;
  
  console.log(`Test admin created with ID ${adminId}`);
}, 30000);

// Cleanup
afterAll(async () => {
  // Clean up
  await cleanTestDatabase();
  await closeTestDatabase();
  await closeTestServer();
}, 10000);

describe('User Management', () => {
  it('Should create a new user', async () => {
    const newUser = {
      name: 'Test Employee',
      email: generateRandomEmail(),
      password: 'TestEmployee123!',
      role: 'employee'
    };
    
    const response = await request(app)
      .post('/API/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUser);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(newUser.email);
    expect(response.body.data.role).toBe(newUser.role);
    
    createdUserId = response.body.data.id;
    
    // Verify user exists in database
    const createdUser = await prisma.user.findUnique({
      where: { id: createdUserId }
    });
    
    expect(createdUser).toBeDefined();
    expect(createdUser?.email).toBe(newUser.email);
    expect(createdUser?.status).toBe(UserStatus.ACTIVE);
    
    // Verify password is hashed
    expect(createdUser?.password).not.toBe(newUser.password);
    
    // Verify activity was logged
    const activity = await prisma.userActivity.findFirst({
      where: {
        userId: createdUserId,
        activity: 'user_created'
      }
    });
    
    expect(activity).toBeDefined();
  });
  
  it('Should get user by ID', async () => {
    const response = await request(app)
      .get(`/API/v1/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(createdUserId);
    
    // Verify sensitive data is not included
    expect(response.body.data).not.toHaveProperty('password');
  });
  
  it('Should get all users with pagination', async () => {
    // Create a few more users to test pagination
    await createTestUser(prisma, { 
      name: 'Pagination Test 1', 
      email: generateRandomEmail() 
    });
    await createTestUser(prisma, { 
      name: 'Pagination Test 2', 
      email: generateRandomEmail() 
    });
    
    const response = await request(app)
      .get('/API/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(3); // Admin + created users
    
    // Verify pagination info
    expect(response.body.meta.pagination).toBeDefined();
    expect(response.body.meta.pagination.page).toBe(1);
    
    // Test with pagination parameters
    const paginatedResponse = await request(app)
      .get('/API/v1/users?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(paginatedResponse.status).toBe(200);
    expect(paginatedResponse.body.data.length).toBeLessThanOrEqual(2);
    expect(paginatedResponse.body.meta.pagination.limit).toBe(2);
  });
  
  it('Should update user information', async () => {
    const updateData = {
      name: 'Updated Employee Name',
      phone: '+49 123 456 7890'
    };
    
    const response = await request(app)
      .put(`/API/v1/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(updateData.name);
    expect(response.body.data.phone).toBe(updateData.phone);
    
    // Verify changes in database
    const updatedUser = await prisma.user.findUnique({
      where: { id: createdUserId }
    });
    
    expect(updatedUser?.name).toBe(updateData.name);
    expect(updatedUser?.phone).toBe(updateData.phone);
    
    // Verify activity was logged
    const activity = await prisma.userActivity.findFirst({
      where: {
        userId: createdUserId,
        activity: 'user_updated'
      }
    });
    
    expect(activity).toBeDefined();
  });
  
  it('Should update user status', async () => {
    const statusData = {
      status: UserStatus.INACTIVE,
      reason: 'Test deactivation'
    };
    
    const response = await request(app)
      .put(`/API/v1/users/${createdUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(statusData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe(UserStatus.INACTIVE);
    
    // Verify changes in database
    const updatedUser = await prisma.user.findUnique({
      where: { id: createdUserId }
    });
    
    expect(updatedUser?.status).toBe(UserStatus.INACTIVE);
    
    // Verify activity was logged
    const activity = await prisma.userActivity.findFirst({
      where: {
        activity: 'status_change',
        details: { contains: 'inactive' }
      }
    });
    
    expect(activity).toBeDefined();
  });
  
  it('Should search users by name or email', async () => {
    const response = await request(app)
      .get('/API/v1/users/search?q=Updated')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Should find the user we updated earlier
    const matchingUser = response.body.data.find((user: any) => user.id === createdUserId);
    expect(matchingUser).toBeDefined();
    expect(matchingUser.name).toContain('Updated');
  });
  
  it('Should not allow non-admin to create users', async () => {
    // Create a regular employee
    const employeeId = await createTestUser(prisma);
    
    // Login as employee
    const loginResponse = await request(app)
      .post('/API/v1/login')
      .send({
        email: 'test-user@example.com',
        password: 'TestPassword123!'
      });
    
    expect(loginResponse.status).toBe(200);
    const employeeToken = loginResponse.body.data.accessToken;
    
    // Try to create a user
    const newUser = {
      name: 'Another Test User',
      email: generateRandomEmail(),
      password: 'AnotherTest123!',
      role: 'employee'
    };
    
    const response = await request(app)
      .post('/API/v1/users')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send(newUser);
    
    // Should be forbidden
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
  
  it('Should allow soft delete of a user', async () => {
    const response = await request(app)
      .delete(`/API/v1/users/${createdUserId}/soft`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verify user is soft deleted in database
    const deletedUser = await prisma.user.findUnique({
      where: { id: createdUserId }
    });
    
    expect(deletedUser?.status).toBe(UserStatus.DELETED);
    
    // Verify activity was logged
    const activity = await prisma.userActivity.findFirst({
      where: {
        activity: 'user_soft_deleted'
      }
    });
    
    expect(activity).toBeDefined();
  });
});
