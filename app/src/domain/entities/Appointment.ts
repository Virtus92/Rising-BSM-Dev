import { BaseEntity } from './BaseEntity';
import { AppointmentStatus } from '../enums/CommonEnums';

/**
 * Termin-Entität
 * 
 * Repräsentiert einen Termin im System.
 */
export class Appointment extends BaseEntity {
  /**
   * Titel des Termins
   */
  title: string;
  
  /**
   * Kunden-ID
   */
  customerId?: number;
  
  /**
   * Datum und Uhrzeit des Termins
   */
  appointmentDate: Date;
  
  /**
   * Dauer in Minuten
   */
  duration?: number;
  
  /**
   * Ort des Termins
   */
  location?: string;
  
  /**
   * Beschreibung
   */
  description?: string;
  
  /**
   * Status des Termins
   */
  status: AppointmentStatus;
  
  /**
   * Konstruktor
   * 
   * @param data - Initialisierungsdaten
   */
  constructor(data: Partial<Appointment> = {}) {
    super(data);
    
    this.title = data.title || '';
    this.customerId = data.customerId;
    this.appointmentDate = data.appointmentDate ? new Date(data.appointmentDate) : new Date();
    this.duration = data.duration;
    this.location = data.location;
    this.description = data.description;
    this.status = data.status || AppointmentStatus.PLANNED;
  }
  
  /**
   * Prüft, ob der Termin bestätigt ist
   */
  isConfirmed(): boolean {
    return this.status === AppointmentStatus.CONFIRMED;
  }
  
  /**
   * Prüft, ob der Termin abgeschlossen ist
   */
  isCompleted(): boolean {
    return this.status === AppointmentStatus.COMPLETED;
  }
  
  /**
   * Prüft, ob der Termin abgesagt ist
   */
  isCancelled(): boolean {
    return this.status === AppointmentStatus.CANCELLED;
  }
  
  /**
   * Prüft, ob der Termin verschoben wurde
   */
  isRescheduled(): boolean {
    return this.status === AppointmentStatus.RESCHEDULED;
  }
  
  /**
   * Aktualisiert den Status des Termins
   * 
   * @param status - Neuer Status
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   */
  updateStatus(status: AppointmentStatus, updatedBy?: number): Appointment {
    this.status = status;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Bestätigt den Termin
   * 
   * @param updatedBy - ID des Benutzers, der die Bestätigung durchführt
   */
  confirm(updatedBy?: number): Appointment {
    return this.updateStatus(AppointmentStatus.CONFIRMED, updatedBy);
  }
  
  /**
   * Markiert den Termin als abgeschlossen
   * 
   * @param updatedBy - ID des Benutzers, der die Markierung durchführt
   */
  complete(updatedBy?: number): Appointment {
    return this.updateStatus(AppointmentStatus.COMPLETED, updatedBy);
  }
  
  /**
   * Sagt den Termin ab
   * 
   * @param updatedBy - ID des Benutzers, der die Absage durchführt
   */
  cancel(updatedBy?: number): Appointment {
    return this.updateStatus(AppointmentStatus.CANCELLED, updatedBy);
  }
  
  /**
   * Markiert den Termin als verschoben
   * 
   * @param updatedBy - ID des Benutzers, der die Verschiebung durchführt
   */
  reschedule(updatedBy?: number): Appointment {
    return this.updateStatus(AppointmentStatus.RESCHEDULED, updatedBy);
  }
  
  /**
   * Aktualisiert die Termindaten
   * 
   * @param data - Neue Daten
   * @param updatedBy - ID des Benutzers, der die Aktualisierung durchführt
   */
  update(data: Partial<Appointment>, updatedBy?: number): Appointment {
    // Nur definierte Eigenschaften aktualisieren
    if (data.title !== undefined) this.title = data.title;
    if (data.customerId !== undefined) this.customerId = data.customerId;
    if (data.appointmentDate !== undefined) this.appointmentDate = new Date(data.appointmentDate);
    if (data.duration !== undefined) this.duration = data.duration;
    if (data.location !== undefined) this.location = data.location;
    if (data.description !== undefined) this.description = data.description;
    if (data.status !== undefined) this.status = data.status;
    
    // Auditdaten aktualisieren
    this.updateAuditData(updatedBy);
    
    return this;
  }
  
  /**
   * Gibt an, ob der Termin in der Vergangenheit liegt
   */
  isPast(): boolean {
    return this.appointmentDate < new Date();
  }
  
  /**
   * Gibt an, ob der Termin heute stattfindet
   */
  isToday(): boolean {
    const today = new Date();
    return (
      this.appointmentDate.getDate() === today.getDate() &&
      this.appointmentDate.getMonth() === today.getMonth() &&
      this.appointmentDate.getFullYear() === today.getFullYear()
    );
  }
  
  /**
   * Konvertiert die Entität in ein einfaches Objekt
   */
  override toObject(): Record<string, any> {
    const baseObject = super.toObject();
    
    return {
      ...baseObject,
      title: this.title,
      customerId: this.customerId,
      appointmentDate: this.appointmentDate,
      duration: this.duration,
      location: this.location,
      description: this.description,
      status: this.status
    };
  }
}
