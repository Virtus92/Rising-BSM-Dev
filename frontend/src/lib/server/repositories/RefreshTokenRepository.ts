import { PrismaClient } from '@prisma/client';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';

/**
 * Repository für die Verwaltung von Refresh-Tokens
 */
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}

  /**
   * Erstellt ein neues Refresh-Token
   */
  async create(data: {
    token: string;
    userId: number;
    expiresAt: Date;
    createdByIp?: string;
  }) {
    try {
      this.logger.debug('RefreshTokenRepository.create', { userId: data.userId });
      
      return await this.prisma.refreshToken.create({
        data: {
          token: data.token,
          userId: data.userId,
          expiresAt: data.expiresAt,
          createdByIp: data.createdByIp
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'RefreshTokenRepository.create');
    }
  }

  /**
   * Findet ein Refresh-Token anhand des Token-Werts
   */
  async findByToken(token: string) {
    try {
      this.logger.debug('RefreshTokenRepository.findByToken');
      
      return await this.prisma.refreshToken.findUnique({
        where: { token }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'RefreshTokenRepository.findByToken');
    }
  }

  /**
   * Markiert ein Refresh-Token als widerrufen
   */
  async revokeToken(token: string, ipAddress?: string) {
    try {
      this.logger.debug('RefreshTokenRepository.revokeToken');
      
      return await this.prisma.refreshToken.update({
        where: { token },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedByIp: ipAddress
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'RefreshTokenRepository.revokeToken');
    }
  }

  /**
   * Ersetzt ein altes Token durch ein neues
   */
  async replaceToken(oldToken: string, newToken: string) {
    try {
      this.logger.debug('RefreshTokenRepository.replaceToken');
      
      return await this.prisma.refreshToken.update({
        where: { token: oldToken },
        data: { replacedByToken: newToken }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'RefreshTokenRepository.replaceToken');
    }
  }

  /**
   * Löscht abgelaufene Tokens
   */
  async removeExpiredTokens() {
    try {
      this.logger.debug('RefreshTokenRepository.removeExpiredTokens');
      
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      
      return result.count;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'RefreshTokenRepository.removeExpiredTokens');
    }
  }

  /**
   * Findet alle Token für einen Benutzer
   */
  async findAllByUserId(userId: number) {
    try {
      this.logger.debug('RefreshTokenRepository.findAllByUserId', { userId });
      
      return await this.prisma.refreshToken.findMany({
        where: { userId }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'RefreshTokenRepository.findAllByUserId');
    }
  }

  /**
   * Widerruft alle Token für einen Benutzer
   */
  async revokeAllUserTokens(userId: number) {
    try {
      this.logger.debug('RefreshTokenRepository.revokeAllUserTokens', { userId });
      
      const result = await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          isRevoked: false
        },
        data: {
          isRevoked: true,
          revokedAt: new Date()
        }
      });
      
      return result.count;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'RefreshTokenRepository.revokeAllUserTokens');
    }
  }
}
