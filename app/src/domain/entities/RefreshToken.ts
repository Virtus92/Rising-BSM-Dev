import { BaseEntity } from './BaseEntity';

/**
 * Refresh-Token-Entität
 * 
 * Repräsentiert ein Token zur Aktualisierung des Zugriffstokens.
 */
export class RefreshToken extends BaseEntity {
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
  
  /**
   * Konstruktor
   * 
   * @param data - Initialisierungsdaten
   */
  constructor(data: Partial<RefreshToken> = {}) {
    super(data);
    
    this.token = data.token || '';
    this.userId = data.userId || 0;
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date();
    this.createdByIp = data.createdByIp;
    this.revokedAt = data.revokedAt ? new Date(data.revokedAt) : undefined;
    this.revokedByIp = data.revokedByIp;
    this.isRevoked = data.isRevoked || false;
    this.replacedByToken = data.replacedByToken;
  }
  
  /**
   * Prüft, ob das Token aktiv ist
   */
  isActive(): boolean {
    return !this.isRevoked && this.expiresAt > new Date();
  }
  
  /**
   * Prüft, ob das Token abgelaufen ist
   */
  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }
  
  /**
   * Widerruft das Token
   * 
   * @param ipAddress - IP-Adresse des Widerrufs
   * @param replacedByToken - Token, das dieses Token ersetzt
   */
  revoke(ipAddress?: string, replacedByToken?: string): RefreshToken {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedByIp = ipAddress;
    this.replacedByToken = replacedByToken;
    return this;
  }
  
  /**
   * Konvertiert die Entität in ein einfaches Objekt
   */
  override toObject(): Record<string, any> {
    const baseObject = super.toObject();
    
    return {
      ...baseObject,
      token: this.token,
      userId: this.userId,
      expiresAt: this.expiresAt,
      createdByIp: this.createdByIp,
      revokedAt: this.revokedAt,
      revokedByIp: this.revokedByIp,
      isRevoked: this.isRevoked,
      replacedByToken: this.replacedByToken
    };
  }
}