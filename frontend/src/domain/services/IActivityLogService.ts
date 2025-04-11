import { IBaseService, ServiceOptions } from './IBaseService';
import { ActivityLog } from '../entities/ActivityLog';
import { EntityType } from '../enums/EntityTypes';
import { ActivityLogDto } from '../dtos/ActivityLogDto';
import { PaginationResult } from '../repositories/IBaseRepository';

/**
 * Service-Interface für Aktivitätsprotokolle
 */
export interface IActivityLogService extends IBaseService<
  ActivityLog,
  Partial<ActivityLog>,
  Partial<ActivityLog>,
  ActivityLogDto
> {
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
  createLog(
    entityType: EntityType,
    entityId: number,
    userId: number | undefined,
    action: string,
    details?: Record<string, any>,
    options?: ServiceOptions
  ): Promise<ActivityLogDto>;
  
  /**
   * Findet Protokolleinträge für eine bestimmte Entität
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @param options - Service-Optionen
   * @returns Protokolleinträge
   */
  findByEntity(entityType: EntityType, entityId: number, options?: ServiceOptions): Promise<ActivityLogDto[]>;
  
  /**
   * Findet Protokolleinträge für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param limit - Maximale Anzahl der Ergebnisse
   * @param options - Service-Optionen
   * @returns Protokolleinträge
   */
  findByUser(userId: number, limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]>;
  
  /**
   * Findet Protokolleinträge für eine spezifische Aktion
   * 
   * @param action - Aktionstyp
   * @param limit - Maximale Anzahl der Ergebnisse
   * @param options - Service-Optionen
   * @returns Protokolleinträge
   */
  findByAction(action: string, limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]>;
  
  /**
   * Findet die neuesten Protokolleinträge
   * 
   * @param limit - Maximale Anzahl der Ergebnisse
   * @param options - Service-Optionen
   * @returns Neueste Protokolleinträge
   */
  getLatest(limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]>;
  
  /**
   * Löscht alle Protokolleinträge für eine bestimmte Entität
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @param options - Service-Optionen
   * @returns Anzahl der gelöschten Einträge
   */
  deleteByEntity(entityType: EntityType, entityId: number, options?: ServiceOptions): Promise<number>;
  
  /**
   * Bereinigt alte Protokolleinträge
   * 
   * @param olderThan - Datum, vor dem Einträge gelöscht werden sollen
   * @param options - Service-Optionen
   * @returns Anzahl der gelöschten Einträge
   */
  cleanupOldLogs(olderThan: Date, options?: ServiceOptions): Promise<number>;
  
  /**
   * Sucht in Protokolleinträgen
   * 
   * @param searchText - Suchbegriff
   * @param filters - Filteroptionen
   * @param options - Service-Optionen
   * @returns Gefundene Protokolleinträge mit Paginierung
   */
  searchLogs(
    searchText: string,
    filters?: {
      entityType?: EntityType;
      userId?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
    },
    options?: ServiceOptions
  ): Promise<PaginationResult<ActivityLogDto>>;
}