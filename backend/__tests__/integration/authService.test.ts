import { PrismaClient } from '@prisma/client';
import { AuthService } from '../../src/services/AuthService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { RefreshTokenRepository } from '../../src/repositories/RefreshTokenRepository';
import { LoggingService } from '../../src/core/LoggingService';
import { ValidationService } from '../../src/core/ValidationService';
import { ErrorHandler } from '../../src/core/ErrorHandler';
import { LogLevel, LogFormat } from '../../src/interfaces/ILoggingService';
import * as bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../../src/entities/User';

describe('AuthService Integration Tests', () => {
  // Setup-Services
  const prisma = new PrismaClient();
  const logger = new LoggingService({ level: LogLevel.DEBUG, format: LogFormat.TEXT });
  const validator = new ValidationService(logger);
  const errorHandler = new ErrorHandler(logger, true);
  
  // Repositories
  const userRepository = new UserRepository(prisma, logger, errorHandler);
  const refreshTokenRepository = new RefreshTokenRepository(prisma, logger, errorHandler);
  
  // Service unter Test
  const authService = new AuthService(
    userRepository,
    refreshTokenRepository,
    logger,
    validator,
    errorHandler
  );
  
  // Testdaten
  let testUser: any;
  let refreshToken: string;
  
  // Setup vor Tests
  beforeAll(async () => {
    // Test-User erstellen
    testUser = await userRepository.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    });
  });
  
  // Aufräumen nach Tests
  afterAll(async () => {
    // Test-User und alle zugehörigen Tokens löschen
    await refreshTokenRepository.deleteAllForUser(testUser.id);
    await userRepository.delete(testUser.id);
    await prisma.$disconnect();
  });
  
  it('should login a user and create refresh token', async () => {
    // Test Login
    const loginResult = await authService.login({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Prüfen des Ergebnisses
    expect(loginResult).toBeDefined();
    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.refreshToken).toBeDefined();
    expect(loginResult.user.id).toBe(testUser.id);
    
    // Refresh-Token speichern für weitere Tests
    refreshToken = loginResult.refreshToken;
  });
  
  it('should refresh the access token', async () => {
    // Token aktualisieren
    const refreshResult = await authService.refreshToken({
      refreshToken
    });
    
    // Prüfen des Ergebnisses
    expect(refreshResult).toBeDefined();
    expect(refreshResult.accessToken).toBeDefined();
    
    // Falls Token-Rotation aktiviert ist, sollte ein neuer Refresh-Token vorhanden sein
    if (process.env.JWT_REFRESH_TOKEN_ROTATION === 'true') {
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.refreshToken).not.toBe(refreshToken);
      refreshToken = refreshResult.refreshToken; // Update für weiteren Test
    }
  });
  
  it('should logout and invalidate refresh token', async () => {
    // Ausloggen mit Token
    const logoutResult = await authService.logout(testUser.id, refreshToken);
    
    // Prüfen des Ergebnisses
    expect(logoutResult).toBeDefined();
    expect(logoutResult.success).toBe(true);
    expect(logoutResult.tokenCount).toBe(1);
    
    // Versuchen, den Token erneut zu verwenden
    try {
      await authService.refreshToken({ refreshToken });
      fail('Refresh should fail with invalidated token');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).statusCode).toBe(401);
    }
  });
});