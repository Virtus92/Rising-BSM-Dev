// Mock for test-utils in client tests (avoid server dependencies)
module.exports = {
  createMockUser: (props = {}) => ({
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    ...props,
  }),
  
  createMockPermission: (props = {}) => ({
    id: 1,
    name: 'Test Permission',
    code: 'test.permission',
    category: 'Test',
    ...props,
  }),
  
  // Mock other test utilities as needed
  testApiRoute: jest.fn(),
  setupMSW: jest.fn(),
};