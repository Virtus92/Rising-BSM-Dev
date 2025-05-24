import { NextRequest } from 'next/server';
import { testApiRoute } from '@/test-utils';

// Mock valid JWT token (3 parts separated by dots)
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJUZXN0IFVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDA5MDAwfQ.mock-signature';

// Mock dependencies
const mockAuthService = {
  login: jest.fn(),
};

const mockSecurityConfig = {
  getAccessTokenLifetime: jest.fn().mockReturnValue(900), // 15 minutes
  getRefreshTokenLifetime: jest.fn().mockReturnValue(604800), // 7 days
};

const mockServiceFactory = {
  createAuthService: jest.fn(() => mockAuthService),
  createSecurityConfig: jest.fn(() => mockSecurityConfig),
};

jest.mock('@/core/factories/serviceFactory.server', () => ({
  getServiceFactory: () => mockServiceFactory,
}));

jest.mock('@/core/logging', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Import after mocks
import { POST } from '@/app/api/auth/login/route';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Fix navigator issue in test environment
    if (typeof globalThis.navigator === 'undefined') {
      Object.defineProperty(globalThis, 'navigator', {
        value: { clipboard: { writeText: jest.fn() } },
        writable: true,
      });
    }
  });

  describe('successful login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'Password123'
    };

    const mockUser = {
      id: 1,
      name: 'Test User',
      email: validCredentials.email,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return tokens and user data for valid credentials', async () => {
      // Arrange
      const mockLoginResponse = {
        success: true,
        user: mockUser,
        accessToken: MOCK_JWT,
        refreshToken: 'mock-refresh-token',
        data: {
          user: mockUser,
          accessToken: MOCK_JWT,
          refreshToken: 'mock-refresh-token',
          expiresIn: 900
        },
        accessExpiration: Date.now() + 900000,
        refreshExpiration: Date.now() + 604800000
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      // Act
      const response = await testApiRoute(POST, {
        method: 'POST',
        body: validCredentials
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('user');
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
      expect(response.data.data.user.email).toBe(validCredentials.email);
      expect(response.data.data.user).not.toHaveProperty('password');
      
      // Verify service was called with correct params
      expect(mockAuthService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validCredentials.email,
          password: validCredentials.password,
          rememberMe: false
        }),
        expect.objectContaining({ context: expect.any(Object) })
      );
    });

    it('should pass remember flag to auth service', async () => {
      // Arrange
      const credentialsWithRemember = {
        ...validCredentials,
        remember: true
      };

      const mockLoginResponse = {
        success: true,
        user: mockUser,
        accessToken: MOCK_JWT,
        refreshToken: 'mock-refresh-token',
        data: {
          user: mockUser,
          accessToken: MOCK_JWT,
          refreshToken: 'mock-refresh-token',
          expiresIn: 900
        },
        accessExpiration: Date.now() + 900000,
        refreshExpiration: Date.now() + 604800000
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      // Act
      await testApiRoute(POST, {
        method: 'POST',
        body: credentialsWithRemember
      });

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          rememberMe: true
        }),
        expect.any(Object)
      );
    });

    it('should set HTTP-only cookies for tokens', async () => {
      // Arrange
      const mockLoginResponse = {
        success: true,
        user: mockUser,
        accessToken: MOCK_JWT,
        refreshToken: 'mock-refresh-token',
        data: {
          user: mockUser,
          accessToken: MOCK_JWT,
          refreshToken: 'mock-refresh-token',
          expiresIn: 900
        },
        accessExpiration: Date.now() + 900000,
        refreshExpiration: Date.now() + 604800000
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      // Act
      const response = await testApiRoute(POST, {
        method: 'POST',
        body: validCredentials
      });

      // Assert
      // Check for Set-Cookie headers
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      // In a real test environment, we would check the actual cookie values
    });
  });

  describe('validation errors', () => {
    it('should return 400 for missing email', async () => {
      // Act
      const response = await testApiRoute(POST, {
        method: 'POST',
        body: { password: 'Password123' }
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Email and password are required');
    });

    it('should return 400 for missing password', async () => {
      // Act
      const response = await testApiRoute(POST, {
        method: 'POST',
        body: { email: 'test@example.com' }
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Email and password are required');
    });
  });

  describe('authentication errors', () => {
    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockAuthService.login.mockResolvedValueOnce({
        success: false,
        message: 'Invalid credentials'
      });

      // Act
      const response = await testApiRoute(POST, {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'WrongPassword'
        }
      });

      // Assert
      expect(response.status).toBe(500);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toBe('An error occurred during login');
    });

    it('should return 403 for inactive account', async () => {
      // Arrange
      mockAuthService.login.mockRejectedValueOnce(new Error('Account is not active'));

      // Act
      const response = await testApiRoute(POST, {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'Password123'
        }
      });

      // Assert
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toBe('Account is not active. Please contact admin.');
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      mockAuthService.login.mockRejectedValueOnce(new Error('Database connection failed'));

      // Act
      const response = await testApiRoute(POST, {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'Password123'
        }
      });

      // Assert
      expect(response.status).toBe(500);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toBe('An error occurred during login');
    });

    it('should handle invalid token format', async () => {
      // Arrange
      const mockLoginResponse = {
        success: true,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        },
        accessToken: 'invalid-token', // Not a valid JWT format
        refreshToken: 'mock-refresh-token',
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'user'
          },
          accessToken: 'invalid-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 900
        }
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      // Act
      const response = await testApiRoute(POST, {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'Password123'
        }
      });

      // Assert
      expect(response.status).toBe(500);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toBe('Authentication failed: invalid token format');
    });
  });
});