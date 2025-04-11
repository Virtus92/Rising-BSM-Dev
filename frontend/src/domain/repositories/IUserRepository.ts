import { IBaseRepository, PaginationResult } from './IBaseRepository';
import { User } from '../entities/User';
import { ActivityLog } from '../entities/ActivityLog';
import { UserFilterParamsDto } from '../dtos/UserDtos';

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
  findUsers(filters: UserFilterParamsDto): Promise<PaginationResult<User>>;
  
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
  getUserActivity(userId: number, limit?: number): Promise<ActivityLog[]>;
  
  /**
   * Löscht einen Benutzer dauerhaft (Hard Delete)
   * 
   * @param userId - Benutzer-ID
   * @returns Erfolg der Operation
   */
  hardDelete(userId: number): Promise<boolean>;
  
  /**
   * Setzt einen Token zum Zurücksetzen des Passworts
   * 
   * @param userId - Benutzer-ID
   * @param token - Reset-Token
   * @param expiry - Ablaufzeitpunkt
   * @returns Aktualisierter Benutzer
   */
  setResetToken(userId: number, token: string, expiry: Date): Promise<User>;
  
  /**
   * Prüft, ob ein Reset-Token gültig ist
   * 
   * @param token - Reset-Token
   * @returns Benutzer-ID, wenn gültig, sonst null
   */
  validateResetToken(token: string): Promise<number | null>;
  
  /**
   * Aktualisiert den letzten Anmeldezeitpunkt
   * 
   * @param userId - Benutzer-ID
   * @returns Aktualisierter Benutzer
   */
  updateLastLogin(userId: number): Promise<User>;
  
  /**
   * Aktualisiert das Profilbild eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param profilePictureUrl - URL des Profilbilds
   * @returns Aktualisierter Benutzer
   */
  updateProfilePicture(userId: number, profilePictureUrl: string): Promise<User>;
  
  /**
   * Loggt Benutzeraktivitäten
   * 
   * @param userId - Benutzer-ID
   * @param action - Aktionstyp
   * @param details - Details zur Aktion
   * @param ipAddress - IP-Adresse
   * @returns Promise mit Ergebnis der Aktivitätsprotokollierung
   */
  logActivity(
    userId: number,
    action: string,
    details?: string,
    ipAddress?: string
  ): Promise<any>;
}