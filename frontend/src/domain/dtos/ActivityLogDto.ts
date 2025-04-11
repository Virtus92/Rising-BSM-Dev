import { BaseResponseDto } from './BaseDto';
import { EntityType } from '../enums/EntityTypes';

/**
 * DTO für ein Aktivitätsprotokoll
 */
export interface ActivityLogDto extends BaseResponseDto {
  /**
   * Typ der Entität
   */
  entityType: EntityType;
  
  /**
   * ID der Entität
   */
  entityId: number;
  
  /**
   * Benutzer-ID
   */
  userId?: number;
  
  /**
   * Benutzername
   */
  userName?: string;
  
  /**
   * Aktionstyp
   */
  action: string;
  
  /**
   * Details
   */
  details?: Record<string, any>;
  
  /**
   * Formatiertes Datum
   */
  formattedDate?: string;
}

/**
 * Spezialisierte Log DTOs für verschiedene Entitätstypen
 */

/**
 * DTO für ein Benutzeraktivitätsprotokoll
 */
export interface UserActivityLogDto extends ActivityLogDto {
  /**
   * Typ der Entität (immer USER)
   */
  entityType: EntityType.USER;
}

/**
 * DTO für ein Kundenprotokoll
 */
export interface CustomerActivityLogDto extends ActivityLogDto {
  /**
   * Typ der Entität (immer CUSTOMER)
   */
  entityType: EntityType.CUSTOMER;
  
  /**
   * Kundenname
   */
  customerName?: string;
}

/**
 * DTO für ein Terminprotokoll
 */
export interface AppointmentActivityLogDto extends ActivityLogDto {
  /**
   * Typ der Entität (immer APPOINTMENT)
   */
  entityType: EntityType.APPOINTMENT;
  
  /**
   * Termintitel
   */
  appointmentTitle?: string;
}

/**
 * DTO für ein Kontaktanfrageprotokoll
 */
export interface RequestActivityLogDto extends ActivityLogDto {
  /**
   * Typ der Entität (immer CONTACT_REQUEST)
   */
  entityType: EntityType.CONTACT_REQUEST;
  
  /**
   * Name des Anfragenden
   */
  requestorName?: string;
}
