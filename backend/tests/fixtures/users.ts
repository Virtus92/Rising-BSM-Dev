import { UserStatus } from '../../src/entities/User.js';

/**
 * Test user data fixtures
 */

// Standard test user
export const testUser = {
  id: 1,
  email: 'test-user@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
  role: 'employee',
  status: UserStatus.ACTIVE,
  phone: '+49 123 456 789',
  profilePicture: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null
};

// Admin test user
export const testAdmin = {
  id: 2,
  email: 'test-admin@example.com',
  password: 'AdminPassword123!',
  name: 'Test Admin',
  role: 'admin',
  status: UserStatus.ACTIVE,
  phone: '+49 987 654 321',
  profilePicture: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null
};

// Manager test user
export const testManager = {
  id: 3,
  email: 'test-manager@example.com',
  password: 'ManagerPassword123!',
  name: 'Test Manager',
  role: 'manager',
  status: UserStatus.ACTIVE,
  phone: '+49 111 222 333',
  profilePicture: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null
};

// Inactive test user
export const inactiveUser = {
  id: 4,
  email: 'inactive@example.com',
  password: 'InactivePassword123!',
  name: 'Inactive User',
  role: 'employee',
  status: UserStatus.INACTIVE,
  phone: '+49 444 555 666',
  profilePicture: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null
};

// Generate a test user with custom properties
export function generateTestUser(overrides = {}) {
  const id = Math.floor(Math.random() * 10000);
  return {
    ...testUser,
    id,
    email: `user-${id}@example.com`,
    name: `Test User ${id}`,
    ...overrides
  };
}
