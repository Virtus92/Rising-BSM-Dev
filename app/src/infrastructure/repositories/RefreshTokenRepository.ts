import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/infrastructure/common/database/prisma';
import { PrismaRepository } from './PrismaRepository';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { RefreshToken } from '@/domain/entities/RefreshToken';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';

/**
 * Repository für Refresh Tokens
 */
export class RefreshTokenRepository extends PrismaRepository<RefreshToken, string> implements IRefreshTokenRepository {
  /**
   * Konstruktor
   * 
   * @param prisma - Prisma-Client
   * @param logger - Logging-Dienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // 'refreshToken' ist der Name des Modells in Prisma
    super(prisma, 'refreshToken', logger, errorHandler);
    
    this.logger.debug('Initialized RefreshTokenRepository');
  }

  /**
   * Findet ein Token anhand seines Strings
   * 
   * @param token - Token-String
   * @returns Promise mit Token oder null
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token }
      });
      
      return refreshToken ? this.mapToDomainEntity(refreshToken) : null;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.findByToken', { error });
      throw this.handleError(error);
    }
  }

  /**
  * Findet alle Tokens eines Benutzers
  * 
  * @param userId - Benutzer-ID
  * @param activeOnly - Nur aktive Tokens
  * @returns Promise mit Tokens
  */
  async findByUserId(userId: number, activeOnly?: boolean): Promise<RefreshToken[]> {
    try {
      const where: any = { userId };
      
      if (activeOnly) {
        where.revokedAt = null;
      }
      
      const refreshTokens = await this.prisma.refreshToken.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      
      return refreshTokens.map(token => this.mapToDomainEntity(token));
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.findByUserId', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @returns Promise mit Anzahl der gelöschten Tokens
   */
  async deleteAllForUser(userId: number): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { userId }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.deleteAllForUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht abgelaufene Tokens
   * 
   * @returns Promise mit Anzahl der gelöschten Tokens
   */
  async deleteExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.deleteExpiredTokens', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Mappt eine ORM-Entität auf eine Domänenentität
   * 
   * @param ormEntity - ORM-Entität
   * @returns Domänenentität
   */
  /**
   * Verarbeitet die Kriterien für Abfragen
   * 
   * @param criteria - Abfragekriterien
   * @returns Processed criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processedCriteria: any = {};
    
    // Handle specific fields that need special processing
    if (criteria.isRevoked !== undefined) {
      processedCriteria.revokedAt = criteria.isRevoked ? { not: null } : null;
    }
    
    // Pass through other criteria
    Object.entries(criteria).forEach(([key, value]) => {
      if (key !== 'isRevoked') {
        processedCriteria[key] = value;
      }
    });
    
    return processedCriteria;
  }

  /**
   * Widerruft ein Token
   * 
   * @param token - Token-String
   * @param ipAddress - IP-Adresse des Widerrufs
   * @param replacedByToken - Token, das dieses Token ersetzt
   * @returns Widerrufenes Token
   */
  async revokeToken(token: string, ipAddress?: string, replacedByToken?: string): Promise<RefreshToken> {
    try {
      const updateData: any = {
        revokedAt: new Date(),
      };
      
      if (ipAddress) {
        updateData.revokedByIp = ipAddress;
      }
      
      if (replacedByToken) {
        updateData.replacedByToken = replacedByToken;
      }
      
      const updatedToken = await this.prisma.refreshToken.update({
        where: { token },
        data: updateData
      });
      
      return this.mapToDomainEntity(updatedToken);
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.revokeToken', { error, token });
      throw this.handleError(error);
    }
  }
  
  /**
   * Widerruft alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @returns Anzahl der widerrufenen Tokens
   */
  async revokeAllUserTokens(userId: number): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.updateMany({
        where: { 
          userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.revokeAllUserTokens', { error, userId });
      throw this.handleError(error);
    }
  }
  
  /**
   * Erstellt ein neues Token mit automatischer Widerrufung des alten Tokens
   * 
   * @param token - Neues Token
   * @param oldToken - Altes Token (optional)
   * @param ipAddress - IP-Adresse
   * @returns Erstelltes Token
   */
  async createWithRotation(token: RefreshToken, oldToken?: string, ipAddress?: string): Promise<RefreshToken> {
    try {
      // Start a transaction to ensure both operations complete
      return await this.prisma.$transaction(async (tx) => {
        // If there's an old token, revoke it first
        if (oldToken) {
          await tx.refreshToken.update({
            where: { token: oldToken },
            data: {
              revokedAt: new Date(),
              revokedByIp: ipAddress,
              replacedByToken: token.token
            }
          });
        }
        
        // Create the new token
        const data = this.mapToORMEntity(token);
        const createdToken = await tx.refreshToken.create({
          data
        });
        
        return this.mapToDomainEntity(createdToken);
      });
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.createWithRotation', { error });
      throw this.handleError(error);
    }
  }

  protected mapToDomainEntity(ormEntity: any): RefreshToken {
    if (!ormEntity) {
      return null as any;
    }
    
    return new RefreshToken({
      token: ormEntity.token,
      userId: ormEntity.userId,
      expiresAt: ormEntity.expiresAt,
      createdAt: ormEntity.createdAt,
      createdByIp: ormEntity.createdByIp,
      revokedAt: ormEntity.revokedAt,
      revokedByIp: ormEntity.revokedByIp,
      isRevoked: ormEntity.revokedAt !== null,
      replacedByToken: ormEntity.replacedByToken
    });
  }

  /**
   * Mappt eine Domänenentität auf eine ORM-Entität
   * 
   * @param domainEntity - Domänenentität
   * @returns ORM-Entität
   */
  protected mapToORMEntity(domainEntity: Partial<RefreshToken>): any {
    // Entferne undefined-Eigenschaften
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    return result;
  }

  /**
   * Implementierung der Aktivitätsprotokollierung
   * 
   * @param userId - Benutzer-ID
   * @param actionType - Aktionstyp
   * @param details - Details
   * @param ipAddress - IP-Adresse
   * @returns Promise mit Protokollergebnis
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string, 
    ipAddress?: string
  ): Promise<any> {
    try {
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType,
          details,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.logActivityImplementation', { 
        error, 
        userId, 
        actionType 
      });
      return null;
    }
  }
}