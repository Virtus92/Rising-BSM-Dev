import { BaseEntity } from './BaseEntity';

/**
 * Terminnotiz-Entität
 * 
 * Repräsentiert eine Notiz zu einem Termin.
 */
export class AppointmentNote extends BaseEntity {
  /**
   * Termin-ID
   */
  appointmentId: number;
  
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
  constructor(data: Partial<AppointmentNote> = {}) {
    super(data);
    
    this.appointmentId = data.appointmentId || 0;
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
  updateText(text: string, updatedBy?: number): AppointmentNote {
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
      appointmentId: this.appointmentId,
      userId: this.userId,
      userName: this.userName,
      text: this.text
    };
  }
}