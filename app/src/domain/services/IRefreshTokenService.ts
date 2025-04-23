import { IBaseService, ServiceOptions } from './IBaseService';
import { RefreshToken } from '../entities/RefreshToken';

/**
 * Service-Interface für Refresh-Tokens
 */
export interface IRefreshTokenService extends IBaseService<RefreshToken, Partial<RefreshToken>, Partial<RefreshToken>, RefreshToken, string> {
  /**
   * Findet ein Token anhand seines Strings
   * 
   * @param token - Token-String
   * @param options - Service-Optionen
   * @returns Gefundenes Token oder null
   */
  findByToken(token: string, options?: ServiceOptions): Promise<RefreshToken | null>;
  
  /**
   * Findet alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param activeOnly - Nur aktive Tokens
   * @param options - Service-Optionen
   * @returns Gefundene Tokens
   */
  findByUser(userId: number, activeOnly?: boolean, options?: ServiceOptions): Promise<RefreshToken[]>;
  
  /**
   * Widerruft ein Token
   * 
   * @param token - Token-String
   * @param ipAddress - IP-Adresse des Widerrufs
   * @param replacedByToken - Token, das dieses Token ersetzt
   * @param options - Service-Optionen
   * @returns Widerrufenes Token
   */
  revokeToken(token: string, ipAddress?: string, replacedByToken?: string, options?: ServiceOptions): Promise<RefreshToken>;
  
  /**
   * Widerruft alle Tokens eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Anzahl der widerrufenen Tokens
   */
  revokeAllUserTokens(userId: number, options?: ServiceOptions): Promise<number>;
  
  /**
   * Erstellt ein neues Token mit automatischer Widerrufung des alten Tokens
   * 
   * @param newToken - Neues Token
   * @param oldToken - Altes Token (optional)
   * @param ipAddress - IP-Adresse
   * @param options - Service-Optionen
   * @returns Erstelltes Token
   */
  rotateToken(newToken: RefreshToken, oldToken?: string, ipAddress?: string, options?: ServiceOptions): Promise<RefreshToken>;
  
  /**
   * Bereinigt abgelaufene Tokens
   * 
   * @param options - Service-Optionen
   * @returns Anzahl der gelöschten Tokens
   */
  cleanupExpiredTokens(options?: ServiceOptions): Promise<number>;
  
  /**
   * Überprüft, ob ein Token gültig ist
   * 
   * @param token - Token-String
   * @param options - Service-Optionen
   * @returns Ob das Token gültig ist
   */
  validateToken(token: string, options?: ServiceOptions): Promise<boolean>;
}