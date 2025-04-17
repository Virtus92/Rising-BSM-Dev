import { BaseEntity } from './BaseEntity';
import { CommonStatus, CustomerType } from '../enums/CommonEnums';

// Re-export der verwendeten Enums für einfachen Zugriff
export { CommonStatus, CustomerType } from '../enums/CommonEnums';

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
   * Alias for postalCode - used on the frontend
   * @deprecated Use postalCode instead
   */
  get zipCode(): string | undefined {
    return this.postalCode;
  }
  
  set zipCode(value: string | undefined) {
    this.postalCode = value;
  }
  
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
  status: CommonStatus;
  
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
    this.status = data.status || CommonStatus.ACTIVE;
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
    return this.status === CommonStatus.ACTIVE;
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
  updateStatus(status: CommonStatus, updatedBy?: number): Customer {
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
    return this.updateStatus(CommonStatus.INACTIVE, updatedBy);
  }
  
  /**
   * Aktiviert den Kunden
   * 
   * @param updatedBy - ID des Benutzers, der die Aktivierung durchführt
   */
  activate(updatedBy?: number): Customer {
    return this.updateStatus(CommonStatus.ACTIVE, updatedBy);
  }
  
  /**
   * Markiert den Kunden als gelöscht (Soft Delete)
   * 
   * @param updatedBy - ID des Benutzers, der die Löschung durchführt
   */
  softDelete(updatedBy?: number): Customer {
    return this.updateStatus(CommonStatus.DELETED, updatedBy);
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
   * Aktualisiert die Newsletter-Einstellung
   * 
   * @param subscribe - Newsletter abonnieren
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   */
  updateNewsletterSubscription(subscribe: boolean, updatedBy?: number): Customer {
    this.newsletter = subscribe;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Validiert das E-Mail-Format (falls eine E-Mail vorhanden ist)
   */
  isValidEmail(): boolean {
    if (!this.email) return true; // keine E-Mail ist valide für Kunden
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.email);
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
      type: this.type,
      fullAddress: this.getFullAddress()
    };
  }
}