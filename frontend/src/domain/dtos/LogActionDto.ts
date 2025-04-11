import { LogActionType } from '../enums/CommonEnums';
import { EntityType } from '../enums/EntityTypes';

/**
 * DTO für Aktion in einer Log-Operation
 */
export interface LogActionDto {
  /**
   * Typ der Aktion
   */
  type: LogActionType;
  
  /**
   * Beschreibung der Aktion
   */
  description: string;
  
  /**
   * Benutzer-ID
   */
  userId?: number;
  
  /**
   * Benutzername
   */
  userName?: string;
  
  /**
   * Entitätstyp
   */
  entityType: EntityType;
  
  /**
   * Entitäts-ID
   */
  entityId: number;
  
  /**
   * Zeitstempel
   */
  timestamp: Date;
  
  /**
   * Zusätzliche Details
   */
  details?: Record<string, any>;
}
