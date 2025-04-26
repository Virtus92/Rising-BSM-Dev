import { IBaseService, ServiceOptions } from './IBaseService';
import { Customer } from '../entities/Customer';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerResponseDto, 
  CustomerDetailResponseDto,
  UpdateCustomerStatusDto,
  CustomerFilterParamsDto,
  CustomerLogDto
} from '../dtos/CustomerDtos';
import { PaginationResult } from '../repositories/IBaseRepository';

/**
 * Service-Interface für Kunden
 */
export interface ICustomerService extends IBaseService<Customer, CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto> {
  /**
   * Findet einen Kunden anhand seiner E-Mail-Adresse
   * 
   * @param email - E-Mail-Adresse
   * @param options - Service-Optionen
   * @returns Gefundener Kunde oder null
   * @throws ServiceError - Bei Fehlern
   */
  findByEmail(email: string, options?: ServiceOptions): Promise<CustomerResponseDto | null>;
  
  /**
   * Ruft detaillierte Kundeninformationen ab
   * 
   * @param id - Kunden-ID
   * @param options - Service-Optionen
   * @returns Detaillierte Kundeninformationen oder null
   * @throws ServiceError - Bei Fehlern
   */
  getCustomerDetails(id: number, options?: ServiceOptions): Promise<CustomerDetailResponseDto | null>;
  
  /**
   * Findet Kunden mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @param options - Service-Optionen
   * @returns Gefundene Kunden mit Paginierung
   * @throws ServiceError - Bei Fehlern
   */
  findCustomers(filters: CustomerFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>>;
  
  /**
   * Aktualisiert den Status eines Kunden
   * 
   * @param customerId - Kunden-ID
   * @param data - Statusänderungsdaten
   * @param options - Service-Optionen
   * @returns Aktualisierter Kunde
   * @throws ServiceError - Bei Fehlern
   */
  updateStatus(customerId: number, data: UpdateCustomerStatusDto, options?: ServiceOptions): Promise<CustomerResponseDto>;
  
  /**
   * Sucht Kunden anhand eines Suchbegriffs
   * 
   * @param searchText - Suchbegriff
   * @param options - Service-Optionen
   * @returns Gefundene Kunden
   * @throws ServiceError - Bei Fehlern
   */
  searchCustomers(searchText: string, options?: ServiceOptions): Promise<CustomerResponseDto[]>;
  
  /**
   * Ruft ähnliche Kunden ab
   * 
   * @param customerId - Kunden-ID
   * @param options - Service-Optionen
   * @returns Ähnliche Kunden
   * @throws ServiceError - Bei Fehlern
   */
  getSimilarCustomers(customerId: number, options?: ServiceOptions): Promise<CustomerResponseDto[]>;
  
  /**
   * Ruft Kundenstatistiken ab
   * 
   * @param options - Service-Optionen
   * @returns Kundenstatistiken
   * @throws ServiceError - Bei Fehlern
   */
  getCustomerStatistics(options?: ServiceOptions): Promise<any>;
  
  /**
   * Ruft Kundenprotokolle ab
   * 
   * @param customerId - Kunden-ID
   * @param options - Service-Optionen
   * @returns Kundenprotokolle
   * @throws ServiceError - Bei Fehlern
   */
  getCustomerLogs(customerId: number, options?: ServiceOptions): Promise<CustomerLogDto[]>;
  
  /**
   * Erstellt einen Protokolleintrag für einen Kunden
   * 
   * @param customerId - Kunden-ID
   * @param action - Aktion
   * @param details - Details
   * @param options - Service-Optionen
   * @returns Erstellter Protokolleintrag
   * @throws ServiceError - Bei Fehlern
   */
  createCustomerLog(
    customerId: number, 
    action: string, 
    details?: string, 
    options?: ServiceOptions
  ): Promise<CustomerLogDto>;
  
  /**
   * Führt einen Soft Delete eines Kunden durch
   * 
   * @param customerId - Kunden-ID
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   * @throws ServiceError - Bei Fehlern
   */
  softDelete(customerId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Führt einen Hard Delete eines Kunden durch (permanentes Löschen)
   * 
   * @param customerId - Kunden-ID
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   * @throws ServiceError - Bei Fehlern
   */
  hardDelete(customerId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Exportiert Kunden
   * 
   * @param filters - Filterparameter
   * @param format - Exportformat (z.B. 'csv', 'xlsx')
   * @param options - Service-Optionen
   * @returns Exportdaten
   * @throws ServiceError - Bei Fehlern
   */
  exportCustomers(filters: CustomerFilterParamsDto, format: string, options?: ServiceOptions): Promise<Buffer>;
  
  /**
   * Aktualisiert die Newsletter-Einstellung eines Kunden
   * 
   * @param customerId - Kunden-ID
   * @param subscribe - Newsletter abonnieren
   * @param options - Service-Optionen
   * @returns Aktualisierter Kunde
   * @throws ServiceError - Bei Fehlern
   */
  updateNewsletterSubscription(customerId: number, subscribe: boolean, options?: ServiceOptions): Promise<CustomerResponseDto>;
}