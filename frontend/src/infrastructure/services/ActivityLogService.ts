import { BaseService } from './BaseService';
import { IActivityLogService } from '@/domain/services/IActivityLogService';
import { IActivityLogRepository } from '@/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/domain/entities/ActivityLog';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { EntityType } from '@/domain/enums/EntityTypes';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Service für Aktivitätsprotokolle
 */
export class ActivityLogService extends BaseService<
  ActivityLog,
  Partial<ActivityLog>,
  Partial<ActivityLog>,
  ActivityLogDto
> implements IActivityLogService {
  /**
   * Konstruktor
   * 
   * @param repository - Repository für den Datenzugriff
   * @param logger - Logging-Dienst
   * @param validator - Validierungsdienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    protected readonly activityLogRepository: IActivityLogRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(activityLogRepository, logger, validator, errorHandler);
    
    this.logger.debug('Initialized ActivityLogService');
  }

  /**
   * Erstellt einen neuen Protokolleintrag
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @param userId - Benutzer-ID
   * @param action - Aktionstyp
   * @param details - Details
   * @param options - Service-Optionen
   * @returns Erstellter Protokolleintrag
   */
  async createLog(
    entityType: EntityType,
    entityId: number,
    userId: number | undefined,
    action: string,
    details?: Record<string, any>,
    options?: ServiceOptions
  ): Promise<ActivityLogDto> {
    try {
      this.logger.debug(`Creating activity log for ${entityType} ${entityId}, action: ${action}`);
      
      // Erstelle den Protokolleintrag
      const activityLog = await this.activityLogRepository.createLog(
        entityType,
        entityId,
        userId,
        action,
        details
      );
      
      // Konvertiere zu DTO
      return this.toDTO(activityLog);
    } catch (error) {
      this.logger.error('Error in ActivityLogService.createLog', { 
        error, 
        entityType, 
        entityId, 
        action 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Protokolleinträge für eine bestimmte Entität
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @param options - Service-Optionen
   * @returns Protokolleinträge
   */
  async findByEntity(
    entityType: EntityType, 
    entityId: number, 
    options?: ServiceOptions
  ): Promise<ActivityLogDto[]> {
    try {
      const logs = await this.activityLogRepository.findByEntity(entityType, entityId);
      return logs.map(log => this.toDTO(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogService.findByEntity', { 
        error, 
        entityType, 
        entityId 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Protokolleinträge für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param limit - Maximale Anzahl der Ergebnisse
   * @param options - Service-Optionen
   * @returns Protokolleinträge
   */
  async findByUser(
    userId: number, 
    limit?: number, 
    options?: ServiceOptions
  ): Promise<ActivityLogDto[]> {
    try {
      const logs = await this.activityLogRepository.findByUser(userId, limit);
      return logs.map(log => this.toDTO(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogService.findByUser', { 
        error, 
        userId
      });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Protokolleinträge für eine spezifische Aktion
   * 
   * @param action - Aktionstyp
   * @param limit - Maximale Anzahl der Ergebnisse
   * @param options - Service-Optionen
   * @returns Protokolleinträge
   */
  async findByAction(
    action: string, 
    limit?: number, 
    options?: ServiceOptions
  ): Promise<ActivityLogDto[]> {
    try {
      const logs = await this.activityLogRepository.findByAction(action, limit);
      return logs.map(log => this.toDTO(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogService.findByAction', { 
        error, 
        action
      });
      throw this.handleError(error);
    }
  }

  /**
   * Findet die neuesten Protokolleinträge
   * 
   * @param limit - Maximale Anzahl der Ergebnisse
   * @param options - Service-Optionen
   * @returns Neueste Protokolleinträge
   */
  async getLatest(
    limit?: number, 
    options?: ServiceOptions
  ): Promise<ActivityLogDto[]> {
    try {
      const logs = await this.activityLogRepository.findLatest(limit);
      return logs.map(log => this.toDTO(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogService.getLatest', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht alle Protokolleinträge für eine bestimmte Entität
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @param options - Service-Optionen
   * @returns Anzahl der gelöschten Einträge
   */
  async deleteByEntity(
    entityType: EntityType, 
    entityId: number, 
    options?: ServiceOptions
  ): Promise<number> {
    try {
      return await this.activityLogRepository.deleteByEntity(entityType, entityId);
    } catch (error) {
      this.logger.error('Error in ActivityLogService.deleteByEntity', { 
        error, 
        entityType, 
        entityId 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Bereinigt alte Protokolleinträge
   * 
   * @param olderThan - Datum, vor dem Einträge gelöscht werden sollen
   * @param options - Service-Optionen
   * @returns Anzahl der gelöschten Einträge
   */
  async cleanupOldLogs(
    olderThan: Date, 
    options?: ServiceOptions
  ): Promise<number> {
    try {
      this.logger.info(`Cleaning up activity logs older than ${olderThan}`);
      return await this.activityLogRepository.deleteOldLogs(olderThan);
    } catch (error) {
      this.logger.error('Error in ActivityLogService.cleanupOldLogs', { 
        error, 
        olderThan 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Sucht in Protokolleinträgen
   * 
   * @param searchText - Suchbegriff
   * @param filters - Filteroptionen
   * @param options - Service-Optionen
   * @returns Gefundene Protokolleinträge mit Paginierung
   */
  async searchLogs(
    searchText: string,
    filters?: {
      entityType?: EntityType;
      userId?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
    },
    options?: ServiceOptions
  ): Promise<PaginationResult<ActivityLogDto>> {
    try {
      const result = await this.activityLogRepository.searchLogs(searchText, filters);
      
      return {
        data: result.data.map(log => this.toDTO(log)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in ActivityLogService.searchLogs', { 
        error, 
        searchText, 
        filters 
      });
      throw this.handleError(error);
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
  fromDTO(dto: Partial<ActivityLog>): Partial<ActivityLog> {
    if (!dto) {
      return null as any;
    }
    
    return {
      id: dto.id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      userId: dto.userId,
      action: dto.action,
      details: dto.details,
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt || Date.now()),
      updatedAt: dto.updatedAt instanceof Date ? dto.updatedAt : new Date(dto.updatedAt || Date.now())
    };
  }

  toDTO(entity: ActivityLog): ActivityLogDto {
    if (!entity) {
      return null as any;
    }
    
    return {
      id: entity.id,
      entityType: entity.entityType,
      entityId: entity.entityId,
      userId: entity.userId,
      action: entity.action,
      details: entity.details,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt?.toISOString() || entity.createdAt.toISOString(),
      // Formatiere Datum für die Anzeige
      formattedDate: this.formatDate(entity.createdAt)
    };
  }

  /**
   * Mappt eine DTO auf eine Entität
   * 
   * @param dto - DTO-Daten
   * @param existingEntity - Vorhandene Entität (für Updates)
   * @returns Entitätsdaten
   */
  protected toEntity(
    dto: Partial<ActivityLog>,
    existingEntity?: ActivityLog
  ): Partial<ActivityLog> {
    // Bei Aktivitätsprotokollen gibt es keine Updates, nur Erstellungen
    return {
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Gibt das Validierungsschema für die Erstellung zurück
   */
  protected getCreateValidationSchema(): any {
    return {
      type: 'object',
      required: ['entityType', 'entityId', 'action'],
      properties: {
        entityType: { type: 'string', enum: Object.values(EntityType) },
        entityId: { type: 'number', minimum: 1 },
        userId: { type: 'number', minimum: 1 },
        action: { type: 'string', minLength: 1 },
        details: { type: 'object' }
      }
    };
  }

  /**
   * Gibt das Validierungsschema für die Aktualisierung zurück
   */
  protected getUpdateValidationSchema(): any {
    // Aktivitätsprotokolle werden nicht aktualisiert
    return this.getCreateValidationSchema();
  }

  /**
   * Formatiert ein Datum
   * 
   * @param date - Zu formatierendes Datum
   * @returns Formatiertes Datum
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
