import { BaseResponseDto, BaseFilterParamsDto } from './BaseDto';
import { Customer } from '../entities/Customer';
import { CommonStatus, CustomerType } from '../enums/CommonEnums';
import { ActivityLogDto } from './ActivityLogDto';

/**
 * Haupt-DTO für Kunden
 */
export interface CustomerDto {
  id: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country: string;
  notes?: string;
  newsletter: boolean;
  status: CommonStatus;
  type: CustomerType;
  // Added properties to match usage in components
  statusLabel?: string;
  typeLabel?: string;
  vatNumber?: string;
}

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
   * Land
   */
  country?: string;
  
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

  /**
   * Firmenname
   */
  companyName?: string;
  
  /**
   * Postleitzahl (alias für postalCode)
   */
  zipCode?: string;
  
  /**
   * Umsatzsteuer-ID
   */
  vatNumber?: string;
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
  status?: CommonStatus;
  
  /**
   * Kundentyp
   */
  type?: CustomerType;

  /**
   * Firmenname
   */
  companyName?: string;
  
  /**
   * Postleitzahl (alias für postalCode)
   */
  zipCode?: string;
  
  /**
   * Umsatzsteuer-ID
   */
  vatNumber?: string;
}

/**
 * DTO für die Rückgabe eines Kunden
 */
export interface CustomerResponseDto extends BaseResponseDto {
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
  status: CommonStatus;
  
  /**
   * Kundentyp
   */
  type: CustomerType;
  
  /**
   * Vollständige Adresse
   */
  fullAddress?: string;

  /**
   * Firmenname
   */
  companyName?: string;
  
  /**
   * Postleitzahl (alias für postalCode)
   */
  zipCode?: string;
  
  /**
   * Umsatzsteuer-ID
   */
  vatNumber?: string;

  /**
   * Status-Label für die Anzeige
   */
  statusLabel?: string;
  
  /**
   * Type-Label für die Anzeige
   */
  typeLabel?: string;
}

/**
 * DTO für detaillierte Kundeninformationen
 */
export interface CustomerDetailResponseDto extends CustomerResponseDto {
  /**
   * Zugehörige Termine
   */
  appointments?: any[];
  
  /**
   * Aktivitätsprotokoll
   */
  activityLogs?: ActivityLogDto[];
  
  /**
   * Kontaktanfragen
   */
  contactRequests?: any[];
}

/**
 * Konvertiert ein Kundenobjekt in ein DTO
 * 
 * @param customer - Kundenobjekt
 * @returns CustomerDto
 */
export function mapCustomerToDto(customer: Customer): CustomerDto {
  return {
    id: customer.id,
    name: customer.name,
    company: customer.company,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    postalCode: customer.postalCode,
    city: customer.city,
    country: customer.country,
    notes: customer.notes,
    newsletter: customer.newsletter,
    status: customer.status,
    type: customer.type,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  };
}

/**
 * DTO für Kundenprotokolle
 */
export interface CustomerLogDto extends ActivityLogDto {
  /**
   * Kunden-ID
   */
  customerId: number;
  
  /**
   * Kundenname
   */
  customerName: string;
}

/**
 * DTO für die Statusänderung eines Kunden
 */
export interface UpdateCustomerStatusDto {
  /**
   * Neuer Status
   */
  status: CommonStatus;
  
  /**
   * Grund für die Statusänderung
   */
  reason?: string;
}

/**
 * Filterparameter für Kundenabfragen
 */
export interface CustomerFilterParamsDto extends BaseFilterParamsDto {
  /**
   * Kundenstatus
   */
  status?: CommonStatus;
  
  /**
   * Kundentyp
   */
  type?: CustomerType;
  
  /**
   * Stadt
   */
  city?: string;
  
  /**
   * Land
   */
  country?: string;
  
  /**
   * Postleitzahl
   */
  postalCode?: string;
  
  /**
   * Newsletter-Anmeldung
   */
  newsletter?: boolean;
}
