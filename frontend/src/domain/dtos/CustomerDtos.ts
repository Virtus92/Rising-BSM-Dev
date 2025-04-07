import { CustomerType } from '../enums/CommonEnums';
import { CustomerStatus } from '../entities/Customer';

/**
 * DTO für die Erstellung eines Kunden
 */
export interface CreateCustomerDto {
  /**
   * Kundenname
   */
  name: string;
  
  /**
   * Firma
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
  country?: string;
  
  /**
   * Notizen
   */
  notes?: string;
  
  /**
   * Newsletter-Anmeldung
   */
  newsletter?: boolean;
  
  /**
   * Kundentyp
   */
  type?: CustomerType;
}

/**
 * DTO für die Aktualisierung eines Kunden
 */
export interface UpdateCustomerDto {
  /**
   * Kundenname
   */
  name?: string;
  
  /**
   * Firma
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
  country?: string;
  
  /**
   * Notizen
   */
  notes?: string;
  
  /**
   * Newsletter-Anmeldung
   */
  newsletter?: boolean;
  
  /**
   * Kundenstatus
   */
  status?: CustomerStatus;
  
  /**
   * Kundentyp
   */
  type?: CustomerType;
}

/**
 * DTO für die Rückgabe eines Kunden
 */
export interface CustomerResponseDto {
  /**
   * Kunden-ID
   */
  id: number;
  
  /**
   * Kundenname
   */
  name: string;
  
  /**
   * Firma
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
   * Notizen
   */
  notes?: string;
  
  /**
   * Newsletter-Anmeldung
   */
  newsletter: boolean;
  
  /**
   * Kundenstatus
   */
  status: string;
  
  /**
   * Kundentyp
   */
  type: string;
  
  /**
   * Vollständige Adresse
   */
  fullAddress?: string;
  
  /**
   * Erstellungsdatum
   */
  createdAt: string;
  
  /**
   * Aktualisierungsdatum
   */
  updatedAt: string;
}

/**
 * DTO für detaillierte Kundeninformationen
 */
export interface CustomerDetailResponseDto extends CustomerResponseDto {
  /**
   * Zugehörige Projekte
   */
  projects?: any[];
  
  /**
   * Zugehörige Termine
   */
  appointments?: any[];
  
  /**
   * Aktivitätsprotokoll
   */
  logs?: CustomerLogDto[];
}

/**
 * DTO für Kundenaktivitäten
 */
export interface CustomerLogDto {
  /**
   * Protokoll-ID
   */
  id: number;
  
  /**
   * Kunden-ID
   */
  customerId: number;
  
  /**
   * Benutzer-ID
   */
  userId?: number;
  
  /**
   * Benutzername
   */
  userName: string;
  
  /**
   * Aktivitätstyp
   */
  action: string;
  
  /**
   * Details
   */
  details?: string;
  
  /**
   * Erstellungsdatum
   */
  createdAt: string;
  
  /**
   * Benutzer
   */
  user?: {
    name: string;
  };
}

/**
 * DTO für die Statusänderung eines Kunden
 */
export interface UpdateCustomerStatusDto {
  /**
   * Neuer Status
   */
  status: CustomerStatus;
  
  /**
   * Grund für die Statusänderung
   */
  reason?: string;
}

/**
 * Filterparameter für Kundenabfragen
 */
export interface CustomerFilterParams {
  /**
   * Suchtext
   */
  search?: string;
  
  /**
   * Kundenstatus
   */
  status?: CustomerStatus;
  
  /**
   * Kundentyp
   */
  type?: CustomerType;
  
  /**
   * Stadt
   */
  city?: string;
  
  /**
   * Postleitzahl
   */
  postalCode?: string;
  
  /**
   * Newsletter-Anmeldung
   */
  newsletter?: boolean;
  
  /**
   * Startdatum für die Filterung
   */
  startDate?: Date;
  
  /**
   * Enddatum für die Filterung
   */
  endDate?: Date;
  
  /**
   * Seitennummer
   */
  page?: number;
  
  /**
   * Einträge pro Seite
   */
  limit?: number;
  
  /**
   * Sortierfeld
   */
  sortBy?: string;
  
  /**
   * Sortierrichtung
   */
  sortDirection?: 'asc' | 'desc';
}
