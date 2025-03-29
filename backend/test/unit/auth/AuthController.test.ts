import { Request, Response } from 'express';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { AuthController } from '../../../src/controllers/AuthController.js';
import { IAuthService } from '../../../src/interfaces/IAuthService.js';
import { ILoggingService } from '../../../src/interfaces/ILoggingService.js';
import { IErrorHandler } from '../../../src/interfaces/IErrorHandler.js';
import { LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from '../../../src/dtos/AuthDtos.js';

// Create a test subclass that exposes protected methods for testing
class TestAuthController extends AuthController {
  public testHandleError(error: any, req: Request, res: Response): void {
    return this.handleError(error, req, res);
  }
}

// Mock dependencies
const mockAuthService = mock<IAuthService>();
const mockLogger = mock<ILoggingService>();
const mockErrorHandler = mock<IErrorHandler>();

// Controller under test
let authController: TestAuthController;

// Test constants
const TEST_USER_ID = 1;
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';
const TEST_ACCESS_TOKEN = 'test-access-token';
const TEST_REFRESH_TOKEN = 'test-refresh-token';
const TEST_RESET_TOKEN = 'test-reset-token';

describe('AuthController Unit Tests', () => {
  // Set up before each test
  beforeEach(() => {
    // Reset all mocks
    mockReset(mockAuthService);
    mockReset(mockLogger);
    mockReset(mockErrorHandler);
    
    // Create the controller with mock dependencies
    authController = new TestAuthController(
      mockAuthService,
      mockLogger,
      mockErrorHandler
    );
    
    // Default error handler behavior
    mockErrorHandler.createUnauthorizedError.mockImplementation(message => {
      const error = new Error(message) as any;
      error.statusCode = 401;
      return error;
    });
    
    mockErrorHandler.createValidationError.mockImplementation((message, errors) => {
      const error = new Error(message) as any;
      error.statusCode = 400;
      error.errors = errors;
      return error;
    });
    
    mockErrorHandler.createForbiddenError.mockImplementation(message => {
      const error = new Error(message) as any;
      error.statusCode = 403;
      return error;
    });
  });
  
  describe('login', () => {
    // Mock login data
    const loginDto: LoginDto = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };
    
    // Mock auth response
    const authResponse = {
      id: TEST_USER_ID,
      accessToken: TEST_ACCESS_TOKEN,
      refreshToken: TEST_REFRESH_TOKEN,
      expiresIn: 900, // 15 minutes
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: TEST_USER_ID,
        name: 'Test User',
        email: TEST_EMAIL,
        role: 'mitarbeiter',
        status: 'aktiv',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    it('should successfully login user', async () => {
      // Arrange
      const mockReq = {
        body: loginDto,
        ip: '127.0.0.1'
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      mockAuthService.login.mockResolvedValueOnce(authResponse);
      
      // Act
      await authController.login(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto,
        { ipAddress: '127.0.0.1' }
      );
      
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: authResponse,
        message: 'Login erfolgreich'
      }));
    });
    
    it('should handle login failure', async () => {
      // Arrange
      const mockReq = {
        body: loginDto
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      const error = new Error('Invalid email or password') as any;
      error.statusCode = 401;
      
      // Set up the controller error handling
      mockAuthService.login.mockRejectedValueOnce(error);
      
      // Use the test method instead of directly accessing protected method
      authController.testHandleError = jest.fn().mockImplementation((error, req, res) => {
        res.status(error.statusCode || 500).json({
          success: false,
          error: error.message,
          statusCode: error.statusCode || 500
        });
      });
      
      // Act
      await authController.login(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.login).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid email or password'
      }));
    });
  });
  
  describe('refreshToken', () => {
    // Mock refresh token data
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: TEST_REFRESH_TOKEN
    };
    
    // Mock refresh response
    const refreshResponse = {
      id: TEST_USER_ID,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 900,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    it('should successfully refresh token', async () => {
      // Arrange
      const mockReq = {
        body: refreshTokenDto,
        ip: '127.0.0.1'
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      mockAuthService.refreshToken.mockResolvedValueOnce(refreshResponse);
      
      // Act
      await authController.refreshToken(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto,
        { ipAddress: '127.0.0.1' }
      );
      
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: refreshResponse,
        message: 'Token erfolgreich aktualisiert'
      }));
    });
    
    it('should handle refresh failure', async () => {
      // Arrange
      const mockReq = {
        body: refreshTokenDto
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      const error = new Error('Invalid refresh token') as any;
      error.statusCode = 401;
      
      mockAuthService.refreshToken.mockRejectedValueOnce(error);
      
      // Use the test method instead of directly accessing protected method
      authController.testHandleError = jest.fn().mockImplementation((error, req, res) => {
        res.status(error.statusCode || 500).json({
          success: false,
          error: error.message,
          statusCode: error.statusCode || 500
        });
      });
      
      // Act
      await authController.refreshToken(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid refresh token'
      }));
    });
  });
  
  describe('forgotPassword', () => {
    // Mock forgot password data
    const forgotPasswordDto: ForgotPasswordDto = {
      email: TEST_EMAIL
    };
    
    it('should process forgot password request', async () => {
      // Arrange
      const mockReq = {
        body: forgotPasswordDto,
        ip: '127.0.0.1',
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost'),
        headers: { origin: 'http://example.com' }
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      mockAuthService.forgotPassword.mockResolvedValueOnce({ success: true });
      
      // Act
      await authController.forgotPassword(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto,
        {
          ipAddress: '127.0.0.1',
          origin: 'http://example.com'
        }
      );
      
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { success: true }
      }));
    });
    
    it('should handle forgot password failure', async () => {
      // Arrange
      const mockReq = {
        body: forgotPasswordDto
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      const error = new Error('Server error') as any;
      error.statusCode = 500;
      
      mockAuthService.forgotPassword.mockRejectedValueOnce(error);
      
      // Use the test method instead of directly accessing protected method
      authController.testHandleError = jest.fn().mockImplementation((error, req, res) => {
        res.status(error.statusCode || 500).json({
          success: false,
          error: error.message,
          statusCode: error.statusCode || 500
        });
      });
      
      // Act
      await authController.forgotPassword(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.forgotPassword).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Server error'
      }));
    });
  });
  
  describe('validateResetToken', () => {
    it('should validate valid reset token', async () => {
      // Arrange
      const mockReq = {
        params: { token: TEST_RESET_TOKEN }
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      mockAuthService.validateResetToken.mockResolvedValueOnce(true);
      
      // Act
      await authController.validateResetToken(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.validateResetToken).toHaveBeenCalledWith(TEST_RESET_TOKEN);
      
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { valid: true }
      }));
    });
    
    it('should validate invalid reset token', async () => {
      // Arrange
      const mockReq = {
        params: { token: 'invalid-token' }
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      mockAuthService.validateResetToken.mockResolvedValueOnce(false);
      
      // Act
      await authController.validateResetToken(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.validateResetToken).toHaveBeenCalledWith('invalid-token');
      
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { valid: false }
      }));
    });
  });
  
  describe('resetPassword', () => {
    // Mock reset password data
    const resetPasswordDto: ResetPasswordDto = {
      token: TEST_RESET_TOKEN,
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    };
    
    it('should reset password successfully', async () => {
      // Arrange
      const mockReq = {
        params: { token: TEST_RESET_TOKEN },
        body: {
          password: resetPasswordDto.password,
          confirmPassword: resetPasswordDto.confirmPassword
        },
        ip: '127.0.0.1'
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      mockAuthService.resetPassword.mockResolvedValueOnce({ success: true });
      
      // Act
      await authController.resetPassword(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        {
          ...resetPasswordDto,
          token: TEST_RESET_TOKEN
        },
        { ipAddress: '127.0.0.1' }
      );
      
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { success: true }
      }));
    });
    
    it('should handle reset password failure', async () => {
      // Arrange
      const mockReq = {
        params: { token: TEST_RESET_TOKEN },
        body: {
          password: resetPasswordDto.password,
          confirmPassword: resetPasswordDto.confirmPassword
        }
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      const error = new Error('Invalid or expired reset token') as any;
      error.statusCode = 401;
      
      mockAuthService.resetPassword.mockRejectedValueOnce(error);
      
      // Use the test method instead of directly accessing protected method
      authController.testHandleError = jest.fn().mockImplementation((error, req, res) => {
        res.status(error.statusCode || 500).json({
          success: false,
          error: error.message,
          statusCode: error.statusCode || 500
        });
      });
      
      // Act
      await authController.resetPassword(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.resetPassword).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid or expired reset token'
      }));
    });
  });
  
  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const mockReq = {
        user: { id: TEST_USER_ID },
        body: { refreshToken: TEST_REFRESH_TOKEN },
        ip: '127.0.0.1'
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      mockAuthService.logout.mockResolvedValueOnce({ 
        success: true,
        tokenCount: 1
      });
      
      // Act
      await authController.logout(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_REFRESH_TOKEN,
        { ipAddress: '127.0.0.1' }
      );
      
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { success: true, tokenCount: 1 }
      }));
    });
    
    it('should handle missing user', async () => {
      // Arrange
      const mockReq = {
        // No user attached to request
        body: { refreshToken: TEST_REFRESH_TOKEN }
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      const error = new Error('Authentifizierung erforderlich') as any;
      error.statusCode = 401;
      mockErrorHandler.createUnauthorizedError.mockReturnValueOnce(error);
      
      // Use the test method instead of directly accessing protected method
      authController.testHandleError = jest.fn().mockImplementation((error, req, res) => {
        res.status(error.statusCode || 500).json({
          success: false,
          error: error.message,
          statusCode: error.statusCode || 500
        });
      });
      
      // Act
      await authController.logout(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Authentifizierung erforderlich'
      }));
    });
    
    it('should handle logout failure', async () => {
      // Arrange
      const mockReq = {
        user: { id: TEST_USER_ID },
        body: { refreshToken: TEST_REFRESH_TOKEN }
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      const error = new Error('Server error') as any;
      error.statusCode = 500;
      
      mockAuthService.logout.mockRejectedValueOnce(error);
      
      // Use the test method instead of directly accessing protected method
      authController.testHandleError = jest.fn().mockImplementation((error, req, res) => {
        res.status(error.statusCode || 500).json({
          success: false,
          error: error.message,
          statusCode: error.statusCode || 500
        });
      });
      
      // Act
      await authController.logout(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Server error'
      }));
    });
  });
  
  describe('getResetToken', () => {
    it('should get reset token for development', async () => {
      // Set environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Arrange
      const mockReq = {
        query: { email: TEST_EMAIL }
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      mockAuthService.getResetTokenForTesting.mockResolvedValueOnce({
        token: TEST_RESET_TOKEN,
        expiry: new Date()
      });
      
      // Act
      await authController.getResetToken(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.getResetTokenForTesting).toHaveBeenCalledWith(TEST_EMAIL);
      
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: TEST_RESET_TOKEN
        })
      }));
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should reject in production environment', async () => {
      // Set environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Arrange
      const mockReq = {
        query: { email: TEST_EMAIL }
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      const error = new Error('Dieser Endpunkt ist nur im Entwicklungsmodus verfügbar') as any;
      error.statusCode = 403;
      mockErrorHandler.createForbiddenError.mockReturnValueOnce(error);
      
      // Use the test method instead of directly accessing protected method
      authController.testHandleError = jest.fn().mockImplementation((error, req, res) => {
        res.status(error.statusCode || 500).json({
          success: false,
          error: error.message,
          statusCode: error.statusCode || 500
        });
      });
      
      // Act
      await authController.getResetToken(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.getResetTokenForTesting).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Dieser Endpunkt ist nur im Entwicklungsmodus verfügbar'
      }));
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should validate email parameter', async () => {
      // Set environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Arrange
      const mockReq = {
        query: {} // Missing email
      } as unknown as Request;
      
      const jsonMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as any;
      
      const error = new Error('Validierung fehlgeschlagen') as any;
      error.statusCode = 400;
      mockErrorHandler.createValidationError.mockReturnValueOnce(error);
      
      // Use the test method instead of directly accessing protected method
      authController.testHandleError = jest.fn().mockImplementation((error, req, res) => {
        res.status(error.statusCode || 500).json({
          success: false,
          error: error.message,
          statusCode: error.statusCode || 500
        });
      });
      
      // Act
      await authController.getResetToken(mockReq, mockRes);
      
      // Assert
      expect(mockAuthService.getResetTokenForTesting).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Validierung fehlgeschlagen'
      }));
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});