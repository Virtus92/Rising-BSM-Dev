/**
 * RefreshToken entity
 * 
 * Domain entity representing a refresh token in the system.
 */
export class RefreshToken {
  /**
   * Token string (primary key)
   */
  token: string;
  
  /**
   * User ID associated with this token
   */
  userId: number;
  
  /**
   * Expiration date
   */
  expiresAt: Date;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * IP address that created the token
   */
  createdByIp?: string;
  
  /**
   * ID of user who created this token (admin/system)
   */
  createdBy?: number;
  
  /**
   * Whether the token has been revoked
   */
  isRevoked: boolean;
  
  /**
   * Revocation timestamp
   */
  revokedAt?: Date;
  
  /**
   * IP address that revoked the token
   */
  revokedByIp?: string;
  
  /**
   * Token that replaced this one (for token rotation)
   */
  replacedByToken?: string;

  /**
   * Creates a new RefreshToken instance
   * 
   * @param data - RefreshToken data
   */
  constructor(data: Partial<RefreshToken> = {}) {
    this.token = data.token || '';
    this.userId = data.userId || 0;
    this.expiresAt = data.expiresAt || new Date();
    this.createdAt = data.createdAt || new Date();
    this.createdByIp = data.createdByIp;
    this.createdBy = data.createdBy;
    this.isRevoked = data.isRevoked || false;
    this.revokedAt = data.revokedAt;
    this.revokedByIp = data.revokedByIp;
    this.replacedByToken = data.replacedByToken;
  }

  /**
   * Check if token is active (not expired and not revoked)
   * 
   * @returns Whether token is active
   */
  isActive(): boolean {
    return !this.isRevoked && this.expiresAt > new Date();
  }

  /**
   * Check if token is expired
   * 
   * @returns Whether token is expired
   */
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Revoke the token
   * 
   * @param ipAddress - IP address of the client
   * @param replacedByToken - New token that replaces this one
   */
  revoke(ipAddress?: string, replacedByToken?: string, revokedBy?: number): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedByIp = ipAddress;
    this.replacedByToken = replacedByToken;
  }
}