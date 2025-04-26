import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from './PrismaRepository';
import { IActivityLogRepository } from '@/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/domain/entities/ActivityLog';
import { EntityType } from '@/domain/enums/EntityTypes';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Implementierung des ActivityLogRepository
 * 
 * Verwaltet die Persistenz von Aktivitätsprotokollen mit Prisma ORM
 */
export class ActivityLogRepository extends PrismaRepository<ActivityLog, number> implements IActivityLogRepository {
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
    // 'userActivity' ist der Name des Modells in Prisma
    super(prisma, 'userActivity', logger, errorHandler);
    
    this.logger.debug('Initialized ActivityLogRepository');
  }

  /**
   * Verarbeitet die Kriterien für Abfragen
   * 
   * @param criteria - Abfragekriterien
   * @returns Verarbeitete Kriterien
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processedCriteria: any = {};
    
    // Handle specific fields that need special processing
    // Map domain entity properties to Prisma entity properties
    if (criteria.userId !== undefined) {
      processedCriteria.userId = criteria.userId;
    }
    
    // Since entityType might not exist as a direct field in the Prisma schema,
    // we handle it through the details JSON field
    if (criteria.entityType !== undefined) {
      processedCriteria.details = {
        contains: `"entityType":"${criteria.entityType}"`
      };
    }
    
    // Since entityId might not exist as a direct field in the Prisma schema,
    // we handle it through the details JSON field similarly to entityType
    if (criteria.entityId !== undefined) {
      // If details already has conditions, we need to merge them
      if (processedCriteria.details) {
        // This is a simplistic approach; consider using a more robust JSON filter if available
        processedCriteria.details.contains = processedCriteria.details.contains + `,"entityId":${criteria.entityId}`;
      } else {
        processedCriteria.details = {
          contains: `"entityId":${criteria.entityId}`
        };
      }
    }
    
    if (criteria.action !== undefined) {
      processedCriteria.activity = criteria.action;
    }
    
    if (criteria.createdAt !== undefined) {
      processedCriteria.timestamp = criteria.createdAt;
    }
    
    // Handle search in details or action
    if (criteria.search) {
      processedCriteria.OR = [
        { details: { contains: criteria.search, mode: 'insensitive' } },
        { activity: { contains: criteria.search, mode: 'insensitive' } }
      ];
    }
    
    // Date range filtering
    if (criteria.startDate || criteria.endDate) {
      processedCriteria.timestamp = processedCriteria.timestamp || {};
      
      if (criteria.startDate) {
        processedCriteria.timestamp.gte = new Date(criteria.startDate);
      }
      
      if (criteria.endDate) {
        processedCriteria.timestamp.lte = new Date(criteria.endDate);
      }
    }
    
    return processedCriteria;
  }

  /**
   * Findet Protokolleinträge für eine bestimmte Entität
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @returns Promise mit Protokolleinträgen
   */
  async findByEntity(entityType: EntityType, entityId: number): Promise<ActivityLog[]> {
    try {
      const logs = await this.prisma.userActivity.findMany({
        where: {
          // Use the details field for entityType and entityId since they may not exist as direct fields
          details: {
            contains: JSON.stringify({ entityType, entityId }).slice(1, -1) // Remove outer braces for partial match
          }
        },
        orderBy: { timestamp: 'desc' } // Fixed field name
      });
      
      return logs.map(log => this.mapToDomainEntity(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.findByEntity', { error, entityType, entityId });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Protokolleinträge für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Promise mit Protokolleinträgen
   */
  async findByUser(userId: number, limit?: number): Promise<ActivityLog[]> {
    try {
      const logs = await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' }, // Fixed field name
        take: limit
      });
      
      return logs.map(log => this.mapToDomainEntity(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.findByUser', { error, userId, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Protokolleinträge für eine spezifische Aktion
   * 
   * @param action - Aktionstyp
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Promise mit Protokolleinträgen
   */
  async findByAction(action: string, limit?: number): Promise<ActivityLog[]> {
    try {
      const logs = await this.prisma.userActivity.findMany({
        where: { activity: action },
        orderBy: { timestamp: 'desc' }, // Fixed field name
        take: limit
      });
      
      return logs.map(log => this.mapToDomainEntity(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.findByAction', { error, action, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Findet die neuesten Protokolleinträge
   * 
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Promise mit neuesten Protokolleinträgen
   */
  async findLatest(limit: number = 10): Promise<ActivityLog[]> {
    try {
      const logs = await this.prisma.userActivity.findMany({
        orderBy: { timestamp: 'desc' }, // Fixed field name
        take: limit
      });
      
      return logs.map(log => this.mapToDomainEntity(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.findLatest', { error, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt einen neuen Protokolleintrag
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @param userId - Benutzer-ID
   * @param action - Aktionstyp
   * @param details - Details
   * @returns Promise mit erstelltem Protokolleintrag
   */
  async createLog(
    entityType: EntityType,
    entityId: number,
    userId: number | undefined,
    action: string,
    details?: Record<string, any>
  ): Promise<ActivityLog> {
    try {
      this.logger.debug(`Creating activity log: ${action} for ${entityType} ${entityId}`);
      
      // Benutzer laden, falls vorhanden
      let userName = 'System';
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });
        if (user) {
          userName = user.name;
        }
      }
      
      // Erstelle den Protokolleintrag
      const log = await this.prisma.userActivity.create({
        data: {
          // Use object with proper Prisma schema fields, ensuring userId is never undefined
          userId: userId || 0, // Default to 0 if userId is undefined
          activity: action,
          // Store entity information in the details field since it doesn't exist as direct fields
          details: JSON.stringify({
            entityType,
            entityId,
            ...(details ? details : {})
          }),
          timestamp: new Date()
        }
      });
      
      // Konvertiere in Domain-Entität
      return this.mapToDomainEntity({
        ...log,
        userName
      });
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.createLog', { 
        error, 
        entityType, 
        entityId, 
        userId, 
        action 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht alle Protokolleinträge für eine bestimmte Entität
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @returns Promise mit Anzahl der gelöschten Einträge
   */
  async deleteByEntity(entityType: EntityType, entityId: number): Promise<number> {
    try {
      // First find all matching records using the details field
      const logs = await this.prisma.userActivity.findMany({
        where: {
          details: {
            contains: JSON.stringify({ entityType, entityId }).slice(1, -1)
          }
        },
        select: { id: true }
      });
      
      // Then delete them by ID if any were found
      if (logs.length === 0) {
        return 0;
      }
      
      const result = await this.prisma.userActivity.deleteMany({
        where: {
          id: { in: logs.map(log => log.id) }
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.deleteByEntity', { error, entityType, entityId });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht alte Protokolleinträge
   * 
   * @param olderThan - Datum, vor dem Einträge gelöscht werden sollen
   * @returns Promise mit Anzahl der gelöschten Einträge
   */
  async deleteOldLogs(olderThan: Date): Promise<number> {
    try {
      const result = await this.prisma.userActivity.deleteMany({
        where: {
          timestamp: { // Fixed field name
            lt: olderThan
          }
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.deleteOldLogs', { error, olderThan });
      throw this.handleError(error);
    }
  }

  /**
   * Sucht in Protokolleinträgen
   * 
   * @param searchText - Suchbegriff
   * @param filters - Filteroptionen
   * @returns Promise mit gefundenen Protokolleinträgen und Paginierung
   */
  async searchLogs(
    searchText: string,
    filters?: {
      entityType?: EntityType;
      userId?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
    }
  ): Promise<PaginationResult<ActivityLog>> {
    try {
      // Baue WHERE-Bedingungen
      const where: any = {};
      
      // Füge Suchtext hinzu
      if (searchText) {
        where.OR = [
          { details: { contains: searchText, mode: 'insensitive' } },
          { activity: { contains: searchText, mode: 'insensitive' } }
        ];
      }
      
      // Füge Filterkriterien hinzu
      if (filters) {
        if (filters.entityType) {
          // Handle entityType through the details field
          if (!where.OR) {
            where.OR = [];
          }
          where.OR.push({ 
            details: { 
              contains: `"entityType":"${filters.entityType}"` 
            } 
          });
        }
        
        if (filters.userId) {
          where.userId = filters.userId;
        }
        
        if (filters.actions && filters.actions.length > 0) {
          where.activity = { in: filters.actions };
        }
        
        // Füge Datumsbereich hinzu
        if (filters.startDate || filters.endDate) {
          where.timestamp = {}; // Fixed field name
          
          if (filters.startDate) {
            where.timestamp.gte = filters.startDate;
          }
          
          if (filters.endDate) {
            where.timestamp.lte = filters.endDate;
          }
        }
      }
      
      // Berechne Paginierung
      const page = 1; // Standard Seite
      const limit = 20; // Standard Limit
      const skip = (page - 1) * limit;
      
      // Führe Abfragen aus
      const [total, logs] = await Promise.all([
        // Count-Abfrage für Gesamtanzahl
        this.prisma.userActivity.count({ where }),
        // Daten-Abfrage mit Paginierung
        this.prisma.userActivity.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' }, // Fixed field name
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        })
      ]);
      
      // Mappe auf Domänenentitäten
      const data = logs.map(log => {
        // Füge Benutzernamen hinzu, falls vorhanden
        const logWithUserName = {
          ...log,
          userName: log.user?.name || 'System'
        };
        
        return this.mapToDomainEntity(logWithUserName);
      });
      
      // Berechne Paginierungsinformationen
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.searchLogs', { error, searchText, filters });
      throw this.handleError(error);
    }
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
      this.logger.info(`Logging activity for user ${userId}: ${actionType}`);
      
      return await this.createLog(
        EntityType.USER,
        userId,
        userId,
        actionType,
        details ? { details, ipAddress } : { ipAddress }
      );
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.logActivityImplementation', { 
        error, 
        userId, 
        actionType 
      });
      return null;
    }
  }

  /**
   * Mappt eine ORM-Entität auf eine Domänenentität
   * 
   * @param ormEntity - ORM-Entität
   * @returns Domänenentität
   */
  /**
   * Extrahiert den EntityType aus dem details-Feld
   * 
   * @param ormEntity - ORM-Entität
   * @returns EntityType oder undefined
   */
  private extractEntityTypeFromDetails(ormEntity: any): EntityType | undefined {
    if (!ormEntity.details) {
      return undefined;
    }
    
    try {
      const details = typeof ormEntity.details === 'string'
        ? JSON.parse(ormEntity.details)
        : ormEntity.details;
      
      if (details.entityType) {
        return details.entityType as EntityType;
      }
      
      return undefined;
    } catch (e) {
      return undefined;
    }
  }
  
  /**
   * Extrahiert die EntityId aus dem details-Feld
   * 
   * @param ormEntity - ORM-Entität
   * @returns EntityId oder undefined
   */
  private extractEntityIdFromDetails(ormEntity: any): number | undefined {
    if (!ormEntity.details) {
      return undefined;
    }
    
    try {
      const details = typeof ormEntity.details === 'string'
        ? JSON.parse(ormEntity.details)
        : ormEntity.details;
      
      if (details.entityId) {
        return details.entityId as number;
      }
      
      return undefined;
    } catch (e) {
      return undefined;
    }
  }

  protected mapToDomainEntity(ormEntity: any): ActivityLog {
    if (!ormEntity) {
      return null as any;
    }
    
    // Parse details aus JSON-String, falls vorhanden
    let details: Record<string, any> | undefined;
    if (ormEntity.details) {
      try {
        details = typeof ormEntity.details === 'string' 
          ? JSON.parse(ormEntity.details) 
          : ormEntity.details;
        
        // Remove entityType and entityId from details if they exist
        // as they will be set as separate properties
        if (details) {
          const { entityType, entityId, ...restDetails } = details;
          details = restDetails;
        }
      } catch (e) {
        // Bei JSON-Parsing-Fehler verwende den String als Details
        details = { text: ormEntity.details };
      }
    }
    
    return new ActivityLog({
      id: ormEntity.id,
      // Extract entityType and entityId from details if not available directly
      entityType: ormEntity.type || this.extractEntityTypeFromDetails(ormEntity) || EntityType.USER,
      entityId: ormEntity.entityId || this.extractEntityIdFromDetails(ormEntity) || 0,
      userId: ormEntity.userId,
      action: ormEntity.activity,
      details,
      createdAt: ormEntity.timestamp || new Date(), // Fixed field name
      updatedAt: ormEntity.timestamp || new Date() // Fixed field name
    });
  }

  /**
   * Mappt eine Domänenentität auf eine ORM-Entität
   * 
   * @param domainEntity - Domänenentität
   * @returns ORM-Entität
   */
  protected mapToORMEntity(domainEntity: Partial<ActivityLog>): any {
    // Entferne undefined-Eigenschaften
    const result: Record<string, any> = {};
    
    // Mappe Eigenschaften
    if (domainEntity.entityType !== undefined) result.type = domainEntity.entityType; // Fixed field name
    if (domainEntity.entityId !== undefined) result.entityId = domainEntity.entityId;
    if (domainEntity.userId !== undefined) result.userId = domainEntity.userId;
    if (domainEntity.action !== undefined) result.activity = domainEntity.action;
    
    // Konvertiere Details zu JSON, falls vorhanden
    if (domainEntity.details !== undefined) {
      result.details = typeof domainEntity.details === 'string' 
        ? domainEntity.details 
        : JSON.stringify(domainEntity.details);
    }
    
    // Setze Zeitstempel
    const timestamp = new Date();
    if (domainEntity.createdAt) {
      result.timestamp = domainEntity.createdAt;
    } else if (!result.id) {
      result.timestamp = timestamp;
    }
    
    return result;
  }
}
