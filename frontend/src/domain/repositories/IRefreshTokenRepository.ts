import { IBaseRepository } from './IBaseRepository';

/**
 * Refresh-Token Entität
 */
export interface RefreshToken {
  /**
   * Token-String
   */
  token: string;
  
  /**
   * Benutzer-ID
   */
  userId: number;
  
  /**
   * Ablaufzeitpunkt
   */
  expiresAt: Date;
  
  /**
   * Erstellungszeitpunkt
   */
  createdAt: Date;
  
  /**
   * IP-Adresse der Erstellung
   */
  createdByIp?: string;
  
  /**
   * Widerrufszeitpunkt
   */
  revokedAt?: Date;
  
  /**
   * IP-Adresse des Widerrufs
   */
  revokedByIp?: string;
  
  /**
   * Ob das Token widerrufen wurde
   */
  isRevoked: boolean;
  
  /**
   * Token, das dieses Token ersetzt hat
   */
  replacedByToken?: string;
}

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
   * @returns Gefundene Tokens
   */
  findByUserId(userId: number): Promise<RefreshToken[]>;
  
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
}
