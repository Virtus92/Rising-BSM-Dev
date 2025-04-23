import { IBaseRepository } from './IBaseRepository';
import { RefreshToken } from '../entities/RefreshToken';

/**
 * Repository-Interface für Refresh-Tokens
 */
export interface IRefreshTokenRepository extends IBaseRepository<RefreshToken, string> {
  /**
   * Findet ein Token anhand seines Strings
   * 
   * @param token - Token-String
   * @returns Gefundenes Token oder null
   */
  findByToken(token: string): Promise<RefreshToken | null>;
  
  /**
   * Findet alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param activeOnly - Nur aktive Tokens
   * @returns Gefundene Tokens
   */
  findByUserId(userId: number, activeOnly?: boolean): Promise<RefreshToken[]>;
  
  /**
   * Widerruft ein Token
   * 
   * @param token - Token-String
   * @param ipAddress - IP-Adresse des Widerrufs
   * @param replacedByToken - Token, das dieses Token ersetzt
   * @returns Widerrufenes Token
   */
  revokeToken(token: string, ipAddress?: string, replacedByToken?: string): Promise<RefreshToken>;
  
  /**
   * Widerruft alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @returns Anzahl der widerrufenen Tokens
   */
  revokeAllUserTokens(userId: number): Promise<number>;
  
  /**
   * Löscht alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @returns Anzahl der gelöschten Tokens
   */
  deleteAllForUser(userId: number): Promise<number>;
  
  /**
   * Löscht abgelaufene Tokens
   * 
   * @returns Anzahl der gelöschten Tokens
   */
  deleteExpiredTokens(): Promise<number>;
  
  /**
   * Erstellt ein neues Token mit automatischer Widerrufung des alten Tokens
   * 
   * @param token - Neues Token
   * @param oldToken - Altes Token (optional)
   * @param ipAddress - IP-Adresse
   * @returns Erstelltes Token
   */
  createWithRotation(token: RefreshToken, oldToken?: string, ipAddress?: string): Promise<RefreshToken>;
}