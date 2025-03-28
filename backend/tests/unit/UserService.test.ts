// Import necessary modules
import { PrismaClient } from '@prisma/client';
import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { mock, mockReset } from 'jest-mock-extended';
import { IUserRepository } from '../../src/interfaces/IUserRepository.js';
import { ILoggingService } from '../../src/interfaces/ILoggingService.js';
import { IValidationService } from '../../src/interfaces/IValidationService.js';
import { IErrorHandler, AppError } from '../../src/interfaces/IErrorHandler.js';
import { UserService } from '../../src/services/UserService.js';
import { User, UserStatus } from '../../src/entities/User.js';

// Import the mocked CryptoHelper
import { CryptoHelper } from '../../src/utils/crypto-helper.js';

// Let Jest handle the proper mocking through jest.setup.cjs

// Mocks erstellen
const mockUserRepository = mock<IUserRepository>();
const mockLogger = mock<ILoggingService>();
const mockValidator = mock<IValidationService>();
const mockErrorHandler = mock<IErrorHandler>();

// Testinstanz erstellen
const userService = new UserService(
  mockUserRepository,
  mockLogger,
  mockValidator,
  mockErrorHandler
);

// Testdaten
const testUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedpassword',
  role: 'employee',
  status: UserStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Vor jedem Test Mock zurücksetzen
beforeEach(() => {
  mockReset(mockUserRepository);
  mockReset(mockLogger);
  mockReset(mockValidator);
  mockReset(mockErrorHandler);
});

describe('UserService', () => {
  describe('findByEmail', () => {
    it('should return user when found', async () => {
      // Mock-Repository-Antwort einrichten
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      
      // Service-Methode aufrufen
      const result = await userService.findByEmail('test@example.com');
      
      // Überprüfen
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });
    
    it('should return null when user not found', async () => {
      // Mock-Repository-Antwort einrichten
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Service-Methode aufrufen
      const result = await userService.findByEmail('nonexistent@example.com');
      
      // Überprüfen
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });
    
    it('should handle errors', async () => {
      // Setup
      const mockError = new Error('Database error');
      mockUserRepository.findByEmail.mockRejectedValue(mockError);
      
      // Set up error handler mock to return an error
      const handledError = {
        ...new AppError('Handled database error', 500),
        success: false as const,
        timestamp: new Date().toDateString()
      };
      mockErrorHandler.handleError.mockReturnValue(handledError);
      
      // Verify that the promise rejects with an error
      await expect(userService.findByEmail('blyat@example.com')).rejects.toThrow(handledError);
      
      // Verify the repository and error handler were called
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('blyat@example.com');
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('authenticate', () => {
    it('should return user when credentials are valid', async () => {
      // Mock-Repository-Antwort einrichten
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      
      // Mock-verifyPassword immer true zurückgeben
      const CryptoHelper = await import('../../src/utils/crypto-helper.js');
      jest.spyOn(CryptoHelper.CryptoHelper, 'verifyPassword').mockResolvedValue(true);
      
      mockUserRepository.update.mockResolvedValue(userEntity);
      
      // Service-Methode aufrufen
      const result = await userService.authenticate('test@example.com', 'password');
      
      // Überprüfen
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
    
    it('should return null when user not found', async () => {
      // Mock-Repository-Antwort einrichten
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Service-Methode aufrufen
      const result = await userService.authenticate('nonexistent@example.com', 'password');
      
      // Überprüfen
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });
  
  describe('findUsers', () => {
    it('should return paginated users', async () => {
      // Mock-Repository-Antwort einrichten
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      
      mockUserRepository.findUsers.mockResolvedValue({
        data: [userEntity],
        pagination: {
          page: 1,
          limit: 10,
          total: 1
        }
      });
      
      // Service-Methode aufrufen
      const result = await userService.findUsers({
        page: 1,
        limit: 10
      });
      
      // Überprüfen
      expect(mockUserRepository.findUsers).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1
      });
    });
  });
  
  // Weitere Testfälle für andere Methoden...
});
