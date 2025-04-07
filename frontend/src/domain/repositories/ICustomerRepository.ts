import { IBaseRepository, PaginationResult } from './IBaseRepository';
import { Customer } from '../entities/Customer';
import { CustomerFilterParams } from '../dtos/CustomerDtos';

/**
 * Repository-Interface für Kunden
 */
export interface ICustomerRepository extends IBaseRepository<Customer> {
  /**
   * Findet einen Kunden anhand seiner E-Mail-Adresse
   * 
   * @param email - E-Mail-Adresse
   * @returns Gefundener Kunde oder null
   */
  findByEmail(email: string): Promise<Customer | null>;
  
  /**
   * Sucht Kunden anhand eines Suchbegriffs
   * 
   * @param term - Suchbegriff
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Gefundene Kunden
   */
  searchCustomers(term: string, limit?: number): Promise<Customer[]>;
  
  /**
   * Findet ähnliche Kunden
   * 
   * @param customerId - Kunden-ID
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Ähnliche Kunden
   */
  findSimilarCustomers(customerId: number, limit?: number): Promise<Customer[]>;
  
  /**
   * Findet einen Kunden mit seinen Beziehungen
   * 
   * @param id - Kunden-ID
   * @returns Gefundener Kunde mit Beziehungen oder null
   */
  findByIdWithRelations(id: number): Promise<Customer | null>;
  
  /**
   * Erstellt einen Kundeneintrag im Protokoll
   * 
   * @param data - Protokolldaten
   * @returns Erstellter Protokolleintrag
   */
  createCustomerLog(data: { customerId: number; userId?: number; action: string; details?: string; }): Promise<any>;
  
  /**
   * Ruft das Protokoll eines Kunden ab
   * 
   * @param customerId - Kunden-ID
   * @returns Kundenprotokoll
   */
  getCustomerLogs(customerId: number): Promise<any[]>;
}
