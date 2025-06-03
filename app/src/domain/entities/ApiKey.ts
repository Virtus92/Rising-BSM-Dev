import { BaseEntity } from './BaseEntity';

/**
 * API Key Types
 */
export enum ApiKeyType {
  ADMIN = 'admin',
  STANDARD = 'standard'
}

/**
 * API Key Status
 */
export enum ApiKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked'
}

/**
 * API Key Environment
 */
export enum ApiKeyEnvironment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development'
}

/**
 * API Key Entity
 * 
 * Represents an API key for programmatic access to the system.
 * Supports both admin keys (full access) and standard keys (granular permissions).
 */
export class ApiKey extends BaseEntity {
  /**
   * Human-readable name for the API key
   */
  name: string;

  /**
   * Optional description of the API key's purpose
   */
  description?: string;

  /**
   * Key prefix (e.g., "rk_live_", "rk_test_")
   */
  keyPrefix: string;

  /**
   * Hashed version of the API key for secure storage
   */
  keyHash: string;

  /**
   * Preview of the key for display purposes (first/last few chars)
   */
  keyPreview: string;

  /**
   * Type of API key (admin or standard)
   */
  type: ApiKeyType;

  /**
   * Current status of the API key
   */
  status: ApiKeyStatus;

  /**
   * Environment the key is intended for
   */
  environment: ApiKeyEnvironment;

  /**
   * Optional expiration date
   */
  expiresAt?: Date;

  /**
   * Last time the key was used
   */
  lastUsedAt?: Date;

  /**
   * IP address of last usage
   */
  lastUsedIp?: string;

  /**
   * Number of times the key has been used
   */
  usageCount: number;

  /**
   * Date the key was revoked (if applicable)
   */
  revokedAt?: Date;

  /**
   * User who revoked the key
   */
  revokedBy?: number;

  /**
   * Reason for revoking the key
   */
  revokedReason?: string;

  /**
   * User who created the key
   */
  createdBy: number;

  /**
   * User who last updated the key
   */
  updatedBy?: number;

  /**
   * Constructor
   * 
   * @param data - Initialization data
   */
  constructor(data: Partial<ApiKey> = {}) {
    super(data);
    
    this.name = data.name || '';
    this.description = data.description;
    this.keyPrefix = data.keyPrefix || '';
    this.keyHash = data.keyHash || '';
    this.keyPreview = data.keyPreview || '';
    this.type = data.type || ApiKeyType.STANDARD;
    this.status = data.status || ApiKeyStatus.ACTIVE;
    this.environment = data.environment || ApiKeyEnvironment.PRODUCTION;
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
    this.lastUsedAt = data.lastUsedAt ? new Date(data.lastUsedAt) : undefined;
    this.lastUsedIp = data.lastUsedIp;
    this.usageCount = data.usageCount || 0;
    this.revokedAt = data.revokedAt ? new Date(data.revokedAt) : undefined;
    this.revokedBy = data.revokedBy;
    this.revokedReason = data.revokedReason;
    this.createdBy = data.createdBy || 0;
    this.updatedBy = data.updatedBy;
  }

  /**
   * Check if API key is currently active and usable
   * 
   * @returns True if the key is active and not expired
   */
  isActive(): boolean {
    if (this.status !== ApiKeyStatus.ACTIVE) return false;
    if (this.expiresAt && this.expiresAt <= new Date()) return false;
    return true;
  }

  /**
   * Check if API key is expired
   * 
   * @returns True if the key has an expiration date and it has passed
   */
  isExpired(): boolean {
    return this.expiresAt ? this.expiresAt <= new Date() : false;
  }

  /**
   * Check if API key will expire soon
   * 
   * @param days - Number of days to check ahead (default: 7)
   * @returns True if the key will expire within the specified days
   */
  isExpiringSoon(days: number = 7): boolean {
    if (!this.expiresAt) return false;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.expiresAt <= futureDate;
  }

  /**
   * Revoke the API key
   * 
   * @param revokedBy - User ID who is revoking the key
   * @param reason - Optional reason for revocation
   */
  revoke(revokedBy: number, reason?: string): void {
    this.status = ApiKeyStatus.REVOKED;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revokedReason = reason;
    this.updatedAt = new Date();
    this.updatedBy = revokedBy;
  }

  /**
   * Update last used information
   * 
   * @param ipAddress - Optional IP address of the request
   */
  updateLastUsed(ipAddress?: string): void {
    this.lastUsedAt = new Date();
    this.lastUsedIp = ipAddress;
    this.usageCount += 1;
    this.updatedAt = new Date();
  }

  /**
   * Activate the API key
   * 
   * @param updatedBy - User ID who is activating the key
   */
  activate(updatedBy: number): void {
    if (this.status === ApiKeyStatus.REVOKED) {
      throw new Error('Cannot activate a revoked API key');
    }
    
    this.status = ApiKeyStatus.ACTIVE;
    this.updatedAt = new Date();
    this.updatedBy = updatedBy;
  }

  /**
   * Deactivate the API key (without revoking)
   * 
   * @param updatedBy - User ID who is deactivating the key
   */
  deactivate(updatedBy: number): void {
    if (this.status === ApiKeyStatus.REVOKED) {
      throw new Error('Cannot deactivate a revoked API key');
    }
    
    this.status = ApiKeyStatus.INACTIVE;
    this.updatedAt = new Date();
    this.updatedBy = updatedBy;
  }

  /**
   * Update the expiration date
   * 
   * @param expiresAt - New expiration date (or null to remove expiration)
   * @param updatedBy - User ID who is updating the expiration
   */
  updateExpiration(expiresAt: Date | null, updatedBy: number): void {
    this.expiresAt = expiresAt || undefined;
    this.updatedAt = new Date();
    this.updatedBy = updatedBy;
  }

  /**
   * Get days until expiration
   * 
   * @returns Number of days until expiration, or null if no expiration
   */
  getDaysUntilExpiration(): number | null {
    if (!this.expiresAt) return null;
    
    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Check if this is an admin key
   * 
   * @returns True if the key type is admin
   */
  isAdminKey(): boolean {
    return this.type === ApiKeyType.ADMIN;
  }

  /**
   * Check if this is a production key
   * 
   * @returns True if the environment is production
   */
  isProductionKey(): boolean {
    return this.environment === ApiKeyEnvironment.PRODUCTION;
  }

  /**
   * Convert the entity to a plain object for database operations
   * 
   * @returns Plain object representation
   */
  override toObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      keyPrefix: this.keyPrefix,
      keyHash: this.keyHash,
      keyPreview: this.keyPreview,
      type: this.type,
      status: this.status,
      environment: this.environment,
      expiresAt: this.expiresAt,
      lastUsedAt: this.lastUsedAt,
      lastUsedIp: this.lastUsedIp,
      usageCount: this.usageCount,
      revokedAt: this.revokedAt,
      revokedBy: this.revokedBy,
      revokedReason: this.revokedReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }
}
