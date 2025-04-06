/**
 * Interface für das RefreshToken-Repository
 */
export interface IRefreshTokenRepository {
  /**
   * Erstellt ein neues Refresh-Token
   */
  create(data: {
    token: string;
    userId: number;
    expiresAt: Date;
    createdByIp?: string;
  }): Promise<any>;

  /**
   * Findet ein Refresh-Token anhand des Token-Werts
   */
  findByToken(token: string): Promise<any | null>;

  /**
   * Markiert ein Refresh-Token als widerrufen
   */
  revokeToken(token: string, ipAddress?: string): Promise<any>;

  /**
   * Ersetzt ein altes Token durch ein neues
   */
  replaceToken(oldToken: string, newToken: string): Promise<any>;

  /**
   * Löscht abgelaufene Tokens
   */
  removeExpiredTokens(): Promise<number>;

  /**
   * Findet alle Token für einen Benutzer
   */
  findAllByUserId(userId: number): Promise<any[]>;

  /**
   * Widerruft alle Token für einen Benutzer
   */
  revokeAllUserTokens(userId: number): Promise<number>;
}
