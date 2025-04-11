import { BaseEntity } from './BaseEntity';
import { EntityType } from '../enums/EntityTypes';

/**
 * Aktivitätsprotokoll-Entität
 * 
 * Repräsentiert einen Protokolleintrag im System.
 */
export class ActivityLog extends BaseEntity {
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
   * Aktionstyp
   */
  action: string;
  
  /**
   * Details (als JSON-Struktur)
   * Speichert zusätzliche Informationen zum Protokolleintrag
   */
  details?: Record<string, any>;
  
  /**
   * Konstruktor
   * 
   * @param data - Initialisierungsdaten
   */
  constructor(data: Partial<ActivityLog> = {}) {
    super(data);
    
    this.entityType = data.entityType || EntityType.USER;
    this.entityId = data.entityId || 0;
    this.userId = data.userId;
    this.action = data.action || '';
    this.details = data.details || {};
  }
  
  /**
   * Fügt weitere Details hinzu
   * 
   * @param key - Schlüssel
   * @param value - Wert
   */
  addDetail(key: string, value: any): ActivityLog {
    if (!this.details) {
      this.details = {};
    }
    
    this.details[key] = value;
    return this;
  }
  
  /**
   * Konvertiert die Entität in ein einfaches Objekt
   */
  override toObject(): Record<string, any> {
    const baseObject = super.toObject();
    
    return {
      ...baseObject,
      entityType: this.entityType,
      entityId: this.entityId,
      userId: this.userId,
      action: this.action,
      details: this.details
    };
  }
  
  /**
   * Erstellt einen Protokolleintrag für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param action - Aktionstyp
   * @param details - Details
   * @param actorId - ID des handelnden Benutzers
   */
  static createUserLog(userId: number, action: string, details?: Record<string, any>, actorId?: number): ActivityLog {
    return new ActivityLog({
      entityType: EntityType.USER,
      entityId: userId,
      userId: actorId,
      action,
      details
    });
  }
  
  /**
   * Erstellt einen Protokolleintrag für einen Kunden
   * 
   * @param customerId - Kunden-ID
   * @param action - Aktionstyp
   * @param details - Details
   * @param userId - ID des handelnden Benutzers
   */
  static createCustomerLog(customerId: number, action: string, details?: Record<string, any>, userId?: number): ActivityLog {
    return new ActivityLog({
      entityType: EntityType.CUSTOMER,
      entityId: customerId,
      userId,
      action,
      details
    });
  }
  
  /**
   * Erstellt einen Protokolleintrag für einen Termin
   * 
   * @param appointmentId - Termin-ID
   * @param action - Aktionstyp
   * @param details - Details
   * @param userId - ID des handelnden Benutzers
   */
  static createAppointmentLog(appointmentId: number, action: string, details?: Record<string, any>, userId?: number): ActivityLog {
    return new ActivityLog({
      entityType: EntityType.APPOINTMENT,
      entityId: appointmentId,
      userId,
      action,
      details
    });
  }
  
  /**
   * Erstellt einen Protokolleintrag für eine Kontaktanfrage
   * 
   * @param requestId - Anfrage-ID
   * @param action - Aktionstyp
   * @param details - Details
   * @param userId - ID des handelnden Benutzers
   */
  static createRequestLog(requestId: number, action: string, details?: Record<string, any>, userId?: number): ActivityLog {
    return new ActivityLog({
      entityType: EntityType.CONTACT_REQUEST,
      entityId: requestId,
      userId,
      action,
      details
    });
  }
}
