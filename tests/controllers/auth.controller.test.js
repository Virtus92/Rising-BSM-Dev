const authController = require('../../controllers/auth.controller');
const pool = require('../../services/db.service');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Mock dependencies
jest.mock('../../services/db.service');
jest.mock('bcryptjs');
jest.mock('crypto');

describe('Auth Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, next
    mockReq = {
      body: {},
      session: {},
      ip: '127.0.0.1'
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();

    // Default pool query mock implementation
    pool.query = jest.fn().mockResolvedValue({ rows: [] });

    // Mock bcrypt
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    bcrypt.hash = jest.fn().mockResolvedValue('hashed_password');

    // Mock crypto
    const mockHash = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed_token')
    };
    crypto.createHash = jest.fn().mockReturnValue(mockHash);
    crypto.randomBytes = jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('random_token')
    });
  });

  describe('login', () => {
    it('should authenticate user with correct credentials', async () => {
      // Mock request body
      mockReq.body = {
        email: 'user@example.com',
        password: 'password123',
        remember: 'on'
      };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Test User',
          email: 'user@example.com',
          passwort: 'hashed_password',
          rolle: 'user',
          status: 'aktiv'
        }]
      });

      // Execute the controller method
      const result = await authController.login(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user@example.com']
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('remember', true);
      expect(result.user).toHaveProperty('id', 1);
      expect(result.user).toHaveProperty('name', 'Test User');
      expect(result.user).toHaveProperty('role', 'user');
      expect(result.user).not.toHaveProperty('passwort');
    });

    it('should handle invalid email', async () => {
      // Mock request body
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await authController.login(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
      expect(mockNext.mock.calls[0][0].message).toContain('Invalid email or password');
    });

    it('should handle incorrect password', async () => {
      // Mock request body
      mockReq.body = {
        email: 'user@example.com',
        password: 'wrong_password'
      };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Test User',
          email: 'user@example.com',
          passwort: 'hashed_password',
          rolle: 'user',
          status: 'aktiv'
        }]
      });

      // Mock bcrypt password comparison to fail
      bcrypt.compare.mockResolvedValueOnce(false);

      // Execute the controller method
      await authController.login(mockReq, mockRes, mockNext);

      // Assertions
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    });

    it('should handle inactive account', async () => {
      // Mock request body
      mockReq.body = {
        email: 'inactive@example.com',
        password: 'password123'
      };

      // Mock database response with inactive user
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 2,
          name: 'Inactive User',
          email: 'inactive@example.com',
          passwort: 'hashed_password',
          rolle: 'user',
          status: 'inaktiv'
        }]
      });

      // Execute the controller method
      await authController.login(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
      expect(mockNext.mock.calls[0][0].message).toContain('inactive or suspended');
    });

    it('should validate required fields', async () => {
      // Mock request with missing fields
      mockReq.body = {
        email: '',
        password: ''
      };

      // Execute the controller method
      await authController.login(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('required');
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for valid email', async () => {
      // Mock request body
      mockReq.body = {
        email: 'user@example.com'
      };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'user@example.com',
          name: 'Test User'
        }]
      });

      // Execute the controller method
      const result = await authController.forgotPassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user@example.com']
      );
      expect(crypto.randomBytes).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('userId', 1);
      expect(result).toHaveProperty('email', 'user@example.com');
      expect(result).toHaveProperty('token', 'random_token');
    });

    it('should return success even if email not found (security)', async () => {
      // Mock request body
      mockReq.body = {
        email: 'nonexistent@example.com'
      };

      // Mock empty database response
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      const result = await authController.forgotPassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['nonexistent@example.com']
      );
      expect(result).toHaveProperty('success', true);
      expect(result).not.toHaveProperty('token');
      expect(result.message).toContain('If an account with this email exists');
    });

    it('should validate email format', async () => {
      // Mock request body with invalid email
      mockReq.body = {
        email: 'not-an-email'
      };

      // Execute the controller method
      await authController.forgotPassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('validateResetToken', () => {
    it('should validate a valid token', async () => {
      // Mock request params
      mockReq.params = {
        token: 'valid-token'
      };

      // Mock database response
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'user@example.com'
        }]
      });

      // Execute the controller method
      const result = await authController.validateResetToken(mockReq, mockRes, mockNext);

      // Assertions
      expect(crypto.createHash).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('reset_token'),
        ['hashed_token']
      );
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('userId', 1);
      expect(result).toHaveProperty('email', 'user@example.com');
    });

    it('should reject expired or invalid tokens', async () => {
      // Mock request params
      mockReq.params = {
        token: 'invalid-token'
      };

      // Mock empty database response (no valid token)
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await authController.validateResetToken(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('Invalid or expired token');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Mock request params and body
      mockReq.params = {
        token: 'valid-token'
      };
      mockReq.body = {
        password: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      // Mock database response for token check
      pool.query.mockImplementation((query) => {
        if (query.includes('reset_token =')) {
          return Promise.resolve({ 
            rows: [{ id: 1 }] 
          });
        }
        return Promise.resolve({ rowCount: 1 });
      });

      // Execute the controller method
      const result = await authController.resetPassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(crypto.createHash).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE benutzer'),
        ['hashed_password', 1]
      );
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Password has been reset successfully');
    });

    it('should validate password length', async () => {
      // Mock request params and body with short password
      mockReq.params = {
        token: 'valid-token'
      };
      mockReq.body = {
        password: 'short',
        confirmPassword: 'short'
      };

      // Execute the controller method
      await authController.resetPassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('at least 8 characters');
    });

    it('should validate password confirmation match', async () => {
      // Mock request params and body with mismatched passwords
      mockReq.params = {
        token: 'valid-token'
      };
      mockReq.body = {
        password: 'newpassword123',
        confirmPassword: 'differentpassword'
      };

      // Execute the controller method
      await authController.resetPassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('do not match');
    });

    it('should reject invalid or expired tokens', async () => {
      // Mock request params and body
      mockReq.params = {
        token: 'invalid-token'
      };
      mockReq.body = {
        password: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      // Mock empty database response (no valid token)
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Execute the controller method
      await authController.resetPassword(mockReq, mockRes, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
      expect(mockNext.mock.calls[0][0].message).toContain('Invalid or expired token');
    });
  });

  describe('logout', () => {
    it('should log user activity on logout', async () => {
      // Setup user in session
      mockReq.session = {
        user: { id: 1, name: 'Test User' }
      };

      // Execute the controller method
      const result = await authController.logout(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO benutzer_aktivitaet'),
        [1, 'logout', '127.0.0.1']
      );
      expect(result).toHaveProperty('success', true);
    });

    it('should handle logout without active session', async () => {
      // No user in session
      mockReq.session = {};

      // Execute the controller method
      const result = await authController.logout(mockReq, mockRes, mockNext);

      // Assertions
      expect(pool.query).not.toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
    });
  });
});
