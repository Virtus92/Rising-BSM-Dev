import { Request, Response } from 'express';
import { 
  login,
  forgotPassword,
  validateResetToken,
  resetPassword,
  refreshToken,
  logout
} from '../../controllers/auth.controller';
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

// Mock Response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Auth Controller', () => {
  let req: Partial<Request>;
  let res: Response;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1'
    };
    res = mockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockAuthResult = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin'
        }
      };
      
      (userService.authenticate as jest.Mock).mockResolvedValue(mockAuthResult);

      // Act
      await login(req as Request, res);

      // Assert
      expect(userService.authenticate).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123'
        },
        {
          ipAddress: '127.0.0.1'
        }
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockAuthResult
      }));
    });

    it('should return validation error when email or password is missing', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com'
        // password missing
      };

      // Act & Assert
      await expect(login(req as Request, res)).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset instructions for valid email', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com'
      };
      
      const mockResult = {
        message: 'Reset instructions sent'
      };
      
      (userService.requestPasswordReset as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await forgotPassword(req as Request, res);

      // Assert
      expect(userService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockResult
      }));
    });

    it('should return success even when email does not exist (for security)', async () => {
      // Arrange
      req.body = {
        email: 'nonexistent@example.com'
      };
      
      (userService.requestPasswordReset as jest.Mock).mockResolvedValue(null);

      // Act
      await forgotPassword(req as Request, res);

      // Assert
      expect(userService.requestPasswordReset).toHaveBeenCalledWith('nonexistent@example.com');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          message: expect.stringContaining('account with this email exists')
        })
      }));
    });
  });

  describe('validateResetToken', () => {
    it('should validate a valid token', async () => {
      // Arrange
      req.params = {
        token: 'valid-reset-token'
      };
      
      const mockValidation = {
        userId: 1,
        email: 'test@example.com'
      };
      
      (userService.validateResetToken as jest.Mock).mockResolvedValue(mockValidation);

      // Act
      await validateResetToken(req as Request, res);

      // Assert
      expect(userService.validateResetToken).toHaveBeenCalledWith('valid-reset-token');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockValidation
      }));
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      req.params = {
        token: 'invalid-token'
      };
      
      (userService.validateResetToken as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(validateResetToken(req as Request, res)).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token and matching passwords', async () => {
      // Arrange
      req.params = {
        token: 'valid-reset-token'
      };
      
      req.body = {
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      
      const mockResult = {
        message: 'Password successfully reset'
      };
      
      (userService.resetPassword as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await resetPassword(req as Request, res);

      // Assert
      expect(userService.resetPassword).toHaveBeenCalledWith(
        'valid-reset-token',
        'newPassword123',
        'newPassword123'
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockResult
      }));
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      // Arrange
      req.body = {
        refreshToken: 'valid-refresh-token'
      };
      
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      };
      
      (userService.refreshToken as jest.Mock).mockResolvedValue(mockTokens);

      // Act
      await refreshToken(req as Request, res);

      // Assert
      expect(userService.refreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
        expect.objectContaining({
          ipAddress: '127.0.0.1'
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockTokens
      }));
    });

    it('should throw error when refresh token is missing', async () => {
      // Arrange
      req.body = {};

      // Act & Assert
      await expect(refreshToken(req as Request, res)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      // Arrange
      req.body = {
        refreshToken: 'valid-refresh-token'
      };
      
      req.user = { 
        id: 1, 
        name: 'Test User', 
        role: 'admin' 
      };
      
      (userService.logout as jest.Mock).mockResolvedValue({ success: true });

      // Act
      await logout(req as any, res);

      // Assert
      expect(userService.logout).toHaveBeenCalledWith(
        'valid-refresh-token',
        expect.objectContaining({
          userContext: expect.objectContaining({
            userId: 1,
            userName: 'Test User',
            userRole: 'admin'
          })
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: {},
        message: 'Logged out successfully'
      }));
    });
  });
});