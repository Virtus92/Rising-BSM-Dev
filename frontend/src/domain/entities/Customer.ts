import { BaseEntity } from './BaseEntity';
import { CustomerType } from '../enums/CommonEnums';

/**
 * Kundenstatus
 */
export enum CustomerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive", 
  DELETED = "deleted"
}

/**
 * Kunden-Entität
 * 
 * Repräsentiert einen Kunden im System.
 */
export class Customer extends BaseEntity {
  /**
   * Kundenname
   */
  name: string;
  
  /**
   * Firma (optional für Geschäftskunden)
   */
  company?: string;
  
  /**
   * E-Mail-Adresse
   */
  email?: string;
  
  /**
   * Telefonnummer
   */
  phone?: string;
  
  /**
   * Adresse
   */
  address?: string;
  
  /**
   * Postleitzahl
   */
  postalCode?: string;
  
  /**
   * Stadt
   */
  city?: string;
  
  /**
   * Land
   */
  country: string;
  
  /**
   * Zusätzliche Notizen
   */
  notes?: string;
  
  /**
   * Newsletter-Anmeldung
   */
  newsletter: boolean;
  
  /**
   * Kundenstatus
   */
  status: CustomerStatus;
  
  /**
   * Kundentyp
   */
  type: CustomerType;
  
  /**
   * Konstruktor
   * 
   * @param data - Initialisierungsdaten
   */
  constructor(data: Partial<Customer> = {}) {
    super(data);
    
    this.name = data.name || '';
    this.company = data.company;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.postalCode = data.postalCode;
    this.city = data.city;
    this.country = data.country || 'Deutschland';
    this.notes = data.notes;
    this.newsletter = data.newsletter || false;
    this.status = data.status || CustomerStatus.ACTIVE;
    this.type = data.type || CustomerType.PRIVATE;
  }
  
  /**
   * Gibt die vollständige Adresse zurück
   */
  getFullAddress(): string {
    const parts = [
      this.address,
      this.postalCode && this.city ? `${this.postalCode} ${this.city}` : this.city,
      this.country
    ];
    
    return parts.filter(Boolean).join(', ');
  }
  
  /**
   * Gibt die Kontaktinformationen zurück
   */
  getContactInfo(): { email?: string; phone?: string } {
    return {
      email: this.email,
      phone: this.phone
    };
  }
  
  /**
   * Prüft, ob der Kunde aktiv ist
   */
  isActive(): boolean {
    return this.status === CustomerStatus.ACTIVE;
  }
  
  /**
   * Prüft, ob der Kunde ein Geschäftskunde ist
   */
  isBusiness(): boolean {
    return this.type === CustomerType.BUSINESS;
  }
  
  /**
   * Aktualisiert den Kundenstatus
   * 
   * @param status - Neuer Status
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   */
  updateStatus(status: CustomerStatus, updatedBy?: number): Customer {
    this.status = status;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Deaktiviert den Kunden
   * 
   * @param updatedBy - ID des Benutzers, der die Deaktivierung durchführt
   */
  deactivate(updatedBy?: number): Customer {
    return this.updateStatus(CustomerStatus.INACTIVE, updatedBy);
  }
  
  /**
   * Aktiviert den Kunden
   * 
   * @param updatedBy - ID des Benutzers, der die Aktivierung durchführt
   */
  activate(updatedBy?: number): Customer {
    return this.updateStatus(CustomerStatus.ACTIVE, updatedBy);
  }
  
  /**
   * Markiert den Kunden als gelöscht (Soft Delete)
   * 
   * @param updatedBy - ID des Benutzers, der die Löschung durchführt
   */
  softDelete(updatedBy?: number): Customer {
    return this.updateStatus(CustomerStatus.DELETED, updatedBy);
  }
  
  /**
   * Aktualisiert die Kundendaten
   * 
   * @param data - Neue Daten
   * @param updatedBy - ID des Benutzers, der die Aktualisierung durchführt
   */
  update(data: Partial<Customer>, updatedBy?: number): Customer {
    // Nur definierte Eigenschaften aktualisieren
    if (data.name !== undefined) this.name = data.name;
    if (data.company !== undefined) this.company = data.company;
    if (data.email !== undefined) this.email = data.email;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.address !== undefined) this.address = data.address;
    if (data.postalCode !== undefined) this.postalCode = data.postalCode;
    if (data.city !== undefined) this.city = data.city;
    if (data.country !== undefined) this.country = data.country;
    if (data.notes !== undefined) this.notes = data.notes;
    if (data.newsletter !== undefined) this.newsletter = data.newsletter;
    if (data.type !== undefined) this.type = data.type;
    
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
      name: this.name,
      company: this.company,
      email: this.email,
      phone: this.phone,
      address: this.address,
      postalCode: this.postalCode,
      city: this.city,
      country: this.country,
      notes: this.notes,
      newsletter: this.newsletter,
      status: this.status,
      type: this.type
    };
  }
}
