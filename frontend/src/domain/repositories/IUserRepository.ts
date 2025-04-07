import { IBaseRepository, PaginationResult } from './IBaseRepository';
import { User } from '../entities/User';
import { UserFilterParams } from '../dtos/UserDtos';

/**
 * Repository-Interface für Benutzer
 */
export interface IUserRepository extends IBaseRepository<User> {
  /**
   * Findet einen Benutzer anhand seiner E-Mail-Adresse
   * 
   * @param email - E-Mail-Adresse
   * @returns Gefundener Benutzer oder null
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Findet einen Benutzer anhand seines Namens
   * 
   * @param name - Name
   * @returns Gefundener Benutzer oder null
   */
  findByName(name: string): Promise<User | null>;
  
  /**
   * Findet Benutzer mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Gefundene Benutzer mit Paginierung
   */
  findUsers(filters: UserFilterParams): Promise<PaginationResult<User>>;
  
  /**
   * Sucht Benutzer anhand eines Suchbegriffs
   * 
   * @param searchText - Suchbegriff
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Gefundene Benutzer
   */
  searchUsers(searchText: string, limit?: number): Promise<User[]>;
  
  /**
   * Aktualisiert das Passwort eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param hashedPassword - Gehashtes Passwort
   * @returns Aktualisierter Benutzer
   */
  updatePassword(userId: number, hashedPassword: string): Promise<User>;
  
  /**
   * Ruft die Aktivitäten eines Benutzers ab
   * 
   * @param userId - Benutzer-ID
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Benutzeraktivitäten
   */
  getUserActivity(userId: number, limit?: number): Promise<any[]>;
  
  /**
   * Löscht einen Benutzer dauerhaft (Hard Delete)
   * 
   * @param userId - Benutzer-ID
   * @returns Erfolg der Operation
   */
  hardDelete(userId: number): Promise<boolean>;
}
