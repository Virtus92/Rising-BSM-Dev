import { BaseService } from './BaseService';
import { IRefreshTokenService } from '@/domain/services/IRefreshTokenService';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { RefreshToken } from '@/domain/entities/RefreshToken';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { ServiceOptions } from '@/domain/services/IBaseService';

/**
 * Service für Refresh-Tokens
 */
export class RefreshTokenService extends BaseService<
  RefreshToken,
  Partial<RefreshToken>,
  Partial<RefreshToken>,
  RefreshToken,
  string
> implements IRefreshTokenService {
  /**
   * Konstruktor
   * 
   * @param repository - Repository für den Datenzugriff
   * @param logger - Logging-Dienst
   * @param validator - Validierungsdienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    protected readonly refreshTokenRepository: IRefreshTokenRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    // Type cast to handle the ID type conversion from string to number
    // IRefreshTokenRepository uses string IDs but BaseRepository expects number IDs
    super(refreshTokenRepository as any, logger, validator, errorHandler);
    
    this.logger.debug('Initialized RefreshTokenService');
  }

  /**
   * Findet ein Token anhand seines Strings
   * 
   * @param token - Token-String
   * @param options - Service-Optionen
   * @returns Gefundenes Token oder null
   */
  async findByToken(token: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    try {
      this.logger.debug('Finding refresh token', { token: token.substring(0, 8) + '...' });
      
      return await this.refreshTokenRepository.findByToken(token);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.findByToken', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Findet alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param activeOnly - Nur aktive Tokens
   * @param options - Service-Optionen
   * @returns Gefundene Tokens
   */
  async findByUser(userId: number, activeOnly?: boolean, options?: ServiceOptions): Promise<RefreshToken[]> {
    try {
      this.logger.debug(`Finding refresh tokens for user ${userId}`, { activeOnly });
      
      return await this.refreshTokenRepository.findByUserId(userId, activeOnly);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.findByUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Widerruft ein Token
   * 
   * @param token - Token-String
   * @param ipAddress - IP-Adresse des Widerrufs
   * @param replacedByToken - Token, das dieses Token ersetzt
   * @param options - Service-Optionen
   * @returns Widerrufenes Token
   */
  async revokeToken(
    token: string, 
    ipAddress?: string, 
    replacedByToken?: string, 
    options?: ServiceOptions
  ): Promise<RefreshToken> {
    try {
      this.logger.debug('Revoking refresh token', { token: token.substring(0, 8) + '...' });
      
      // Prüfe, ob das Token existiert
      const refreshToken = await this.refreshTokenRepository.findByToken(token);
      
      if (!refreshToken) {
        throw this.errorHandler.createNotFoundError('Refresh token not found');
      }
      
      // Prüfe Benutzerberechtigungen, falls Benutzerkontext vorhanden
      if (options?.context?.userId && 
          refreshToken.userId !== options.context.userId && 
          options.context.role !== 'admin') {
        throw this.errorHandler.createForbiddenError('You do not have permission to revoke this token');
      }
      
      // Widerrufe das Token
      return await this.refreshTokenRepository.revokeToken(token, ipAddress, replacedByToken);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.revokeToken', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Widerruft alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Anzahl der widerrufenen Tokens
   */
  async revokeAllUserTokens(userId: number, options?: ServiceOptions): Promise<number> {
    try {
      this.logger.debug(`Revoking all refresh tokens for user ${userId}`);
      
      // Prüfe Benutzerberechtigungen, falls Benutzerkontext vorhanden
      if (options?.context?.userId && 
          userId !== options.context.userId && 
          options.context.role !== 'admin') {
        throw this.errorHandler.createForbiddenError('You do not have permission to revoke tokens for this user');
      }
      
      // Widerrufe alle Tokens
      return await this.refreshTokenRepository.revokeAllUserTokens(userId);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.revokeAllUserTokens', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt ein neues Token mit automatischer Widerrufung des alten Tokens
   * 
   * @param newToken - Neues Token
   * @param oldToken - Altes Token (optional)
   * @param ipAddress - IP-Adresse
   * @param options - Service-Optionen
   * @returns Erstelltes Token
   */
  async rotateToken(
    newToken: RefreshToken, 
    oldToken?: string, 
    ipAddress?: string, 
    options?: ServiceOptions
  ): Promise<RefreshToken> {
    try {
      this.logger.debug('Rotating refresh token', { 
        userId: newToken.userId,
        oldToken: oldToken ? oldToken.substring(0, 8) + '...' : undefined,
        newToken: newToken.token.substring(0, 8) + '...'
      });
      
      // Validiere das neue Token
      await this.validate(newToken);
      
      // Rotiere das Token
      return await this.refreshTokenRepository.createWithRotation(newToken, oldToken, ipAddress);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.rotateToken', { error, userId: newToken.userId });
      throw this.handleError(error);
    }
  }

  /**
   * Bereinigt abgelaufene Tokens
   * 
   * @param options - Service-Optionen
   * @returns Anzahl der gelöschten Tokens
   */
  async cleanupExpiredTokens(options?: ServiceOptions): Promise<number> {
    try {
      this.logger.info('Cleaning up expired refresh tokens');
      
      // Prüfe, ob die Aktion von einem Administrator ausgeführt wird
      if (options?.context?.role !== 'admin' && !options?.context?.system) {
        throw this.errorHandler.createForbiddenError('Only administrators can clean up expired tokens');
      }
      
      // Bereinige abgelaufene Tokens
      return await this.refreshTokenRepository.deleteExpiredTokens();
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.cleanupExpiredTokens', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Überprüft, ob ein Token gültig ist
   * 
   * @param token - Token-String
   * @param options - Service-Optionen
   * @returns Ob das Token gültig ist
   */
  async validateToken(token: string, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.debug('Validating refresh token', { token: token.substring(0, 8) + '...' });
      
      // Hole das Token
      const refreshToken = await this.refreshTokenRepository.findByToken(token);
      
      // Prüfe, ob das Token existiert und aktiv ist
      if (!refreshToken) {
        return false;
      }
      
      return refreshToken.isActive();
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.validateToken', { error });
      return false;
    }
  }

  /**
   * Mappt eine Entität auf eine Response DTO
   * 
   * @param entity - Zu mappende Entität
   * @returns Response DTO
   */
  /**
   * Konvertiert eine DTO in eine Entität
   * 
   * @param dto - DTO
   * @returns Entität
   */
  fromDTO(dto: Partial<RefreshToken>): Partial<RefreshToken> {
    if (!dto) {
      return {} as Partial<RefreshToken>;
    }
    
    return {
      token: dto.token,
      userId: dto.userId,
      expiresAt: dto.expiresAt instanceof Date ? dto.expiresAt : new Date(dto.expiresAt || ''),
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt || Date.now()),
      createdByIp: dto.createdByIp,
      revokedAt: dto.revokedAt instanceof Date ? dto.revokedAt : dto.revokedAt ? new Date(dto.revokedAt) : undefined,
      revokedByIp: dto.revokedByIp,
      replacedByToken: dto.replacedByToken,
      isRevoked: dto.isRevoked || false,
      updatedAt: new Date()
    };
  }
  
  toDTO(entity: RefreshToken): RefreshToken {
    return entity;
  }

  /**
   * Mappt eine DTO auf eine Entität
   * 
   * @param dto - DTO-Daten
   * @param existingEntity - Vorhandene Entität (für Updates)
   * @returns Entitätsdaten
   */
  protected toEntity(
    dto: Partial<RefreshToken>,
    existingEntity?: RefreshToken
  ): Partial<RefreshToken> {
    if (existingEntity) {
      // Update-Fall - in der Regel werden Tokens nicht aktualisiert
      return {
        ...dto,
        updatedAt: new Date()
      };
    } else {
      // Create-Fall
      return {
        ...dto,
        isRevoked: dto.isRevoked || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  /**
   * Gibt das Validierungsschema für die Erstellung zurück
   */
  protected getCreateValidationSchema(): any {
    return {
      type: 'object',
      required: ['token', 'userId', 'expiresAt'],
      properties: {
        token: { type: 'string', minLength: 1 },
        userId: { type: 'number', minimum: 1 },
        expiresAt: { type: 'object', instanceof: 'Date' },
        createdByIp: { type: 'string' },
        isRevoked: { type: 'boolean' }
      }
    };
  }

  /**
   * Gibt das Validierungsschema für die Aktualisierung zurück
   */
  protected getUpdateValidationSchema(): any {
    return {
      type: 'object',
      properties: {
        isRevoked: { type: 'boolean' },
        revokedAt: { type: 'object', instanceof: 'Date' },
        revokedByIp: { type: 'string' },
        replacedByToken: { type: 'string' }
      }
    };
  }
}
