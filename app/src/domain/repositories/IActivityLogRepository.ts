import { IBaseRepository, PaginationResult } from './IBaseRepository';
import { ActivityLog } from '../entities/ActivityLog';
import { EntityType } from '../enums/EntityTypes';

/**
 * Repository-Interface für Aktivitätsprotokolle
 */
export interface IActivityLogRepository extends IBaseRepository<ActivityLog> {
  /**
   * Findet Protokolleinträge für eine bestimmte Entität
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @returns Protokolleinträge
   */
  findByEntity(entityType: EntityType, entityId: number): Promise<ActivityLog[]>;
  
  /**
   * Findet Protokolleinträge für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Protokolleinträge
   */
  findByUser(userId: number, limit?: number): Promise<ActivityLog[]>;
  
  /**
   * Findet Protokolleinträge für eine spezifische Aktion
   * 
   * @param action - Aktionstyp
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Protokolleinträge
   */
  findByAction(action: string, limit?: number): Promise<ActivityLog[]>;
  
  /**
   * Findet die neuesten Protokolleinträge
   * 
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Neueste Protokolleinträge
   */
  findLatest(limit?: number): Promise<ActivityLog[]>;
  
  /**
   * Erstellt einen neuen Protokolleintrag
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @param userId - Benutzer-ID
   * @param action - Aktionstyp
   * @param details - Details
   * @returns Erstellter Protokolleintrag
   */
  createLog(
    entityType: EntityType,
    entityId: number,
    userId: number | undefined,
    action: string,
    details?: Record<string, any>
  ): Promise<ActivityLog>;
  
  /**
   * Löscht alle Protokolleinträge für eine bestimmte Entität
   * 
   * @param entityType - Entitätstyp
   * @param entityId - Entitäts-ID
   * @returns Anzahl der gelöschten Einträge
   */
  deleteByEntity(entityType: EntityType, entityId: number): Promise<number>;
  
  /**
   * Löscht alte Protokolleinträge
   * 
   * @param olderThan - Datum, vor dem Einträge gelöscht werden sollen
   * @returns Anzahl der gelöschten Einträge
   */
  deleteOldLogs(olderThan: Date): Promise<number>;
  
  /**
   * Sucht in Protokolleinträgen
   * 
   * @param searchText - Suchbegriff
   * @param filters - Filteroptionen
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
    }
  ): Promise<PaginationResult<ActivityLog>>;
}