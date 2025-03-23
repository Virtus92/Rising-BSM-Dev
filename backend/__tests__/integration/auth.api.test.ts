import express from 'express';
import request from 'supertest';
import { createTestApp } from './setup';
import authRoutes from '../../routes/auth.routes';
import { userService } from '../../services/user.service';

// Mock the userService
jest.mock('../../services/user.service', () => ({
  userService: {
    authenticate: jest.fn(),
    requestPasswordReset: jest.fn(),
    validateResetToken: jest.fn(),
    resetPassword: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn()
  }
}));

describe('Authentication API', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
    app.use('/api/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockAuthResult = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin'
        }
      };
      
      (userService.authenticate as jest.Mock).mockResolvedValue(mockAuthResult);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockAuthResult
      }));
      expect(userService.authenticate).toHaveBeenCalledWith(
        loginData,
        expect.objectContaining({
          ipAddress: expect.any(String)
        })
      );
    });

    it('should return validation error when email or password is missing', async () => {
      // Arrange
      const invalidData = {
        email: 'test@example.com'
        // Missing password
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        error: expect.stringContaining('required')
      }));
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      // Arrange
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };
      
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      };
      
      (userService.refreshToken as jest.Mock).mockResolvedValue(mockTokens);

      // Act
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send(refreshData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockTokens
      }));
      expect(userService.refreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
        expect.objectContaining({
          ipAddress: expect.any(String)
        })
      );
    });

    it('should return validation error when refresh token is missing', async () => {
      // Arrange
      const invalidData = {};

      // Act
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset instructions for valid email', async () => {
      // Arrange
      const emailData = {
        email: 'test@example.com'
      };
      
      const mockResult = {
        message: 'Reset instructions sent'
      };
      
      (userService.requestPasswordReset as jest.Mock).mockResolvedValue(mockResult);

      // Act
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(emailData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          message: expect.any(String)
        })
      }));
      expect(userService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    it('should return success even when email does not exist (for security)', async () => {
      // Arrange
      const emailData = {
        email: 'nonexistent@example.com'
      };
      
      (userService.requestPasswordReset as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(emailData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true
      }));
    });
  });

  describe('GET /api/auth/reset-token/:token', () => {
    it('should validate a valid token', async () => {
      // Arrange
      const mockValidation = {
        userId: 1,
        email: 'test@example.com'
      };
      
      (userService.validateResetToken as jest.Mock).mockResolvedValue(mockValidation);

      // Act
      const response = await request(app)
        .get('/api/auth/reset-token/valid-reset-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockValidation
      }));
      expect(userService.validateResetToken).toHaveBeenCalledWith('valid-reset-token');
    });

    it('should return error for invalid token', async () => {
      // Arrange
      (userService.validateResetToken as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/api/auth/reset-token/invalid-token');

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password/:token', () => {
    it('should reset password with valid token and matching passwords', async () => {
      // Arrange
      const resetData = {
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      
      const mockResult = {
        message: 'Password successfully reset'
      };
      
      (userService.resetPassword as jest.Mock).mockResolvedValue(mockResult);

      // Act
      const response = await request(app)
        .post('/api/auth/reset-password/valid-reset-token')
        .send(resetData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: mockResult
      }));
      expect(userService.resetPassword).toHaveBeenCalledWith(
        'valid-reset-token',
        'newPassword123',
        'newPassword123'
      );
    });

    it('should return error when passwords do not match', async () => {
      // Arrange
      const resetData = {
        password: 'newPassword123',
        confirmPassword: 'differentPassword'
      };
      
      (userService.resetPassword as jest.Mock).mockRejectedValue(new Error('Passwords do not match'));

      // Act
      const response = await request(app)
        .post('/api/auth/reset-password/valid-reset-token')
        .send(resetData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      // Arrange
      const logoutData = {
        refreshToken: 'valid-refresh-token'
      };
      
      (userService.logout as jest.Mock).mockResolvedValue({ success: true });

      // Mock JWT verification for the authenticated route
      jest.mock('../../middleware/auth.middleware', () => ({
        authenticate: (req, res, next) => {
          req.user = { id: 1, name: 'Test User', role: 'admin' };
          next();
        }
      }));

      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .send(logoutData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        message: 'Logged out successfully'
      }));
    });
  });
});