import { BaseEntity } from './BaseEntity';
import { NotificationType } from '../enums/CommonEnums';

/**
 * Benachrichtigungs-Entität
 * 
 * Repräsentiert eine Benachrichtigung im System.
 */
export class Notification extends BaseEntity {
  /**
   * Benutzer-ID des Empfängers
   */
  userId?: number;
  
  /**
   * Typ der Benachrichtigung
   */
  type: NotificationType;
  
  /**
   * Titel der Benachrichtigung
   */
  title: string;
  
  /**
   * Nachrichtentext
   */
  message?: string;
  
  /**
   * Ob die Benachrichtigung gelesen wurde
   */
  isRead: boolean;
  
  /**
   * ID des referenzierten Kunden
   */
  customerId?: number;
  
  /**
   * ID des referenzierten Termins
   */
  appointmentId?: number;
  
  /**
   * ID der referenzierten Kontaktanfrage
   */
  contactRequestId?: number;
  
  /**
   * Optionaler Link für weitere Aktionen
   */
  link?: string;
  
  /**
   * Konstruktor
   * 
   * @param data - Initialisierungsdaten
   */
  constructor(data: Partial<Notification> = {}) {
    super(data);
    
    this.userId = data.userId;
    this.type = data.type || NotificationType.INFO;
    this.title = data.title || '';
    this.message = data.message;
    this.isRead = data.isRead || false;
    this.customerId = data.customerId;
    this.appointmentId = data.appointmentId;
    this.contactRequestId = data.contactRequestId;
    this.link = data.link;
  }
  
  /**
   * Markiert die Benachrichtigung als gelesen
   * 
   * @param updatedBy - ID des Benutzers, der die Markierung durchführt
   */
  markAsRead(updatedBy?: number): Notification {
    this.isRead = true;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Markiert die Benachrichtigung als ungelesen
   * 
   * @param updatedBy - ID des Benutzers, der die Markierung durchführt
   */
  markAsUnread(updatedBy?: number): Notification {
    this.isRead = false;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Aktualisiert die Benachrichtigungsdaten
   * 
   * @param data - Neue Daten
   * @param updatedBy - ID des Benutzers, der die Aktualisierung durchführt
   */
  update(data: Partial<Notification>, updatedBy?: number): Notification {
    // Nur definierte Eigenschaften aktualisieren
    if (data.title !== undefined) this.title = data.title;
    if (data.message !== undefined) this.message = data.message;
    if (data.type !== undefined) this.type = data.type;
    if (data.isRead !== undefined) this.isRead = data.isRead;
    
    // Auditdaten aktualisieren
    this.updateAuditData(updatedBy);
    
    return this;
  }
  
  /**
   * Konvertiert die Entität in ein einfaches Objekt
   */
  override toObject(): Record<string, any> {
    const baseObject = super.toObject();
    
    return {
      ...baseObject,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      isRead: this.isRead,
      customerId: this.customerId,
      appointmentId: this.appointmentId,
      contactRequestId: this.contactRequestId,
      link: this.link
    };
  }
}
