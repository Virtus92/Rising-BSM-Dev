import { BaseEntity } from './BaseEntity';

/**
 * Anfragennotiz-Entität
 * 
 * Repräsentiert eine Notiz zu einer Kontaktanfrage.
 */
export class RequestNote extends BaseEntity {
  /**
   * Anfrage-ID
   */
  requestId: number;
  
  /**
   * Benutzer-ID
   */
  userId: number;
  
  /**
   * Benutzername
   */
  userName: string;
  
  /**
   * Notiztext
   */
  text: string;
  
  /**
   * Konstruktor
   * 
   * @param data - Initialisierungsdaten
   */
  constructor(data: Partial<RequestNote> = {}) {
    super(data);
    
    this.requestId = data.requestId || 0;
    this.userId = data.userId || 0;
    this.userName = data.userName || '';
    this.text = data.text || '';
  }
  
  /**
   * Aktualisiert den Notiztext
   * 
   * @param text - Neuer Text
   * @param updatedBy - ID des Benutzers, der die Aktualisierung durchführt
   */
  updateText(text: string, updatedBy?: number): RequestNote {
    this.text = text;
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
      requestId: this.requestId,
      userId: this.userId,
      userName: this.userName,
      text: this.text
    };
  }
}