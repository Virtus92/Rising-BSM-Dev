const authController = require('../../controllers/auth.controller');
const { mockRequest, mockResponse, mockDbClient } = require('../setup');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validateInput } = require('../../utils/validators');

describe('Auth Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = mockRequest();
    mockRes = mockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('should successfully login user with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      mockReq.body = loginData;

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user'
      };

      mockDbClient.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true);

      // Act
      await authController.login(mockReq, mockRes, mockNext);

      // Assert
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM benutzer WHERE email = $1'),
        [loginData.email]
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(mockReq.session.user).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      }));
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard');
    });

    test('should handle invalid credentials', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockDbClient.query.mockResolvedValueOnce({ rows: [{ 
        password: 'hashed-password' 
      }] });
      bcrypt.compare.mockResolvedValueOnce(false);

      // Act
      await authController.login(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/login');
    });

    test('should handle non-existent user', async () => {
      // Arrange
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockDbClient.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await authController.login(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('register', () => {
    test('should successfully register new user', async () => {
      // Arrange
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User'
      };
      mockReq.body = registerData;

      mockDbClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [{ id: 1, ...registerData }] }); // Insert new user

      // Act
      await authController.register(mockReq, mockRes, mockNext);

      // Assert
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM benutzer WHERE email = $1'),
        [registerData.email]
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, expect.any(String));
      expect(mockReq.flash).toHaveBeenCalledWith('success', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/login');
    });

    test('should handle existing email', async () => {
      // Arrange
      mockReq.body = {
        email: 'existing@example.com',
        password: 'password123'
      };

      mockDbClient.query.mockResolvedValueOnce({ 
        rows: [{ email: 'existing@example.com' }] 
      });

      // Act
      await authController.register(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/register');
    });

    test('should handle validation errors', async () => {
      // Arrange
      mockReq.body = {
        email: 'invalid-email',
        password: '123' // Too short
      };

      validateInput.mockReturnValueOnce({
        isValid: false,
        errors: {
          email: 'Invalid email format',
          password: 'Password too short'
        }
      });

      // Act
      await authController.register(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/register');
    });
  });

  describe('logout', () => {
    test('should successfully logout user', async () => {
      // Arrange
      mockReq.session.destroy = jest.fn(callback => callback());

      // Act
      await authController.logout(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.session.destroy).toHaveBeenCalled();
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });

    test('should handle logout errors', async () => {
      // Arrange
      const error = new Error('Session destroy error');
      mockReq.session.destroy = jest.fn(callback => callback(error));

      // Act
      await authController.logout(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('resetPassword', () => {
    test('should successfully initiate password reset', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com'
      };

      mockDbClient.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Find user
        .mockResolvedValueOnce({ rows: [{ token: 'reset-token' }] }); // Save token

      // Act
      await authController.resetPassword(mockReq, mockRes, mockNext);

      // Assert
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM benutzer WHERE email = $1'),
        [mockReq.body.email]
      );
      expect(mockReq.flash).toHaveBeenCalledWith('success', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/login');
    });

    test('should handle non-existent email for password reset', async () => {
      // Arrange
      mockReq.body = {
        email: 'nonexistent@example.com'
      };

      mockDbClient.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await authController.resetPassword(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/reset-password');
    });
  });

  describe('updatePassword', () => {
    test('should successfully update password', async () => {
      // Arrange
      mockReq.body = {
        token: 'valid-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com'
      };

      mockDbClient.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Verify token
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Update password

      // Act
      await authController.updatePassword(mockReq, mockRes, mockNext);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.password, expect.any(String));
      expect(mockReq.flash).toHaveBeenCalledWith('success', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/login');
    });

    test('should handle invalid reset token', async () => {
      // Arrange
      mockReq.body = {
        token: 'invalid-token',
        password: 'newpassword123'
      };

      mockDbClient.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await authController.updatePassword(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(mockRes.redirect).toHaveBeenCalledWith('/reset-password');
    });
  });
});
