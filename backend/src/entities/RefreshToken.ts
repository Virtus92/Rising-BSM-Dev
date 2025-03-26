import { BaseEntity } from '../types/models/index.js';

/**
 * RefreshToken entity
 * 
 * Domain entity representing a refresh token in the system.
 */
interface RefreshTokenProps {
  token: string;
  userId: number;
  expiresAt?: Date; // Our property name
  expires?: Date; // Database column name
  createdAt?: Date;
  createdByIp?: string;
  isRevoked?: boolean;
  revokedAt?: Date;
  revokedByIp?: string;
  replacedByToken?: string;
}

export class RefreshToken implements BaseEntity {
  id: number;
  updatedAt: Date;
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
   * @param data - RefreshToken data
   */
  constructor(props: RefreshTokenProps & { id: number, updatedAt: Date }) {
    this.id = props.id;
    this.updatedAt = props.updatedAt;
    this.token = props.token;
    this.userId = props.userId;
    this.expiresAt = props.expiresAt || props.expires || new Date(); // Support both property names
    this.userId = props.userId;
    this.expiresAt = props.expiresAt || props.expires || new Date(); // Support both property names
    this.createdAt = props.createdAt || new Date();
    this.createdByIp = props.createdByIp;
    this.isRevoked = props.isRevoked || false;
    this.revokedAt = props.revokedAt;
    this.revokedByIp = props.revokedByIp;
    this.replacedByToken = props.replacedByToken;
  }

  /**
   * Check if token is active (not expired and not revoked)
   * 
   * @returns Whether token is active
   */
  isActive(): boolean {
    // Return false if token is revoked or expired
    const now = new Date();
    return !this.isRevoked && this.expiresAt > now;
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
  revoke(ipAddress?: string, replacedByToken?: string): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedByIp = ipAddress;
    this.replacedByToken = replacedByToken;
  }
}