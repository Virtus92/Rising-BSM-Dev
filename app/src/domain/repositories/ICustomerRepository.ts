import { IBaseRepository, PaginationResult } from './IBaseRepository';
import { Customer } from '../entities/Customer';
import { CustomerFilterParamsDto } from '../dtos/CustomerDtos';
import { CommonStatus, CustomerType } from '../enums/CommonEnums';

/**
 * Repository-Interface für Kunden
 */
export interface ICustomerRepository extends IBaseRepository<Customer> {
  /**
   * Findet Kunden basierend auf Kriterien
   * 
   * @param criteria - Suchkriterien
   * @returns Array von Kunden, die den Kriterien entsprechen
   */
  find(criteria: Record<string, any>): Promise<Customer[]>;
  
  /**
   * Prüft, ob ein Kunde existiert
   * 
   * @param id - Kunden-ID
   * @returns true, wenn der Kunde existiert, sonst false
   */
  exists(id: number): Promise<boolean>;

  /**
   * Findet Notizen zu einem Kunden
   * 
   * @param customerId - Kunden-ID
   * @returns Notizen zum Kunden
   */
  findNotes(customerId: number): Promise<any[]>;

  /**
   * Fügt einem Kunden eine Notiz hinzu
   * 
   * @param customerId - Kunden-ID
   * @param userId - Benutzer-ID
   * @param text - Notiztext
   * @returns Erstellte Notiz
   */
  addNote(customerId: number, userId: number, text: string): Promise<any>;
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
   * Findet Kunden mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Gefundene Kunden mit Paginierung
   */
  findCustomers(filters: CustomerFilterParamsDto): Promise<PaginationResult<Customer>>;
  
  /**
   * Aktualisiert den Status eines Kunden
   * 
   * @param id - Kunden-ID
   * @param status - Neuer Status
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierter Kunde
   */
  updateStatus(id: number, status: CommonStatus, updatedBy?: number): Promise<Customer>;
  
  /**
   * Führt einen Soft Delete eines Kunden durch
   * 
   * @param id - Kunden-ID
   * @param updatedBy - ID des Benutzers, der die Löschung durchführt
   * @returns Erfolg der Operation
   */
  softDelete(id: number, updatedBy?: number): Promise<boolean>;
  
  /**
   * Aktualisiert die Newsletter-Einstellung eines Kunden
   * 
   * @param id - Kunden-ID
   * @param subscribe - Newsletter abonnieren
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierter Kunde
   */
  updateNewsletterSubscription(id: number, subscribe: boolean, updatedBy?: number): Promise<Customer>;
  
  /**
   * Findet Kunden nach Typ
   * 
   * @param type - Kundentyp
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Gefundene Kunden
   */
  findByType(type: CustomerType, limit?: number): Promise<Customer[]>;
  
  /**
   * Findet Kunden nach Status
   * 
   * @param status - Kundenstatus
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Gefundene Kunden
   */
  findByStatus(status: CommonStatus, limit?: number): Promise<Customer[]>;
  
  /**
   * Findet kürzlich erstellte oder aktualisierte Kunden
   * 
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Gefundene Kunden
   */
  findRecent(limit?: number): Promise<Customer[]>;

  /**
   * Aktualisiert mehrere Kunden auf einmal
   * 
   * @param ids - Array von Kunden-IDs
   * @param data - Zu aktualisierende Daten
   * @returns Anzahl der aktualisierten Kunden
   */
  bulkUpdate(ids: number[], data: Partial<Customer>): Promise<number>;

  /**
   * Gets logs for a customer
   * 
   * @param customerId - Customer ID
   * @returns Customer logs
   */
  getCustomerLogs(customerId: number): Promise<any[]>;
  
  /**
   * Creates a customer log entry
   * 
   * @param data - Log data
   * @returns Created log
   */
  createCustomerLog(data: { customerId: number; userId?: number; action: string; details?: string }): Promise<any>;
}