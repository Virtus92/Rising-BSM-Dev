/**
 * Base Entity
 * 
 * Die Basisklasse für alle Entitäten in der Domäne.
 * Stellt gemeinsame Eigenschaften und Funktionen bereit.
 */

/**
 * Interface for entity constructors
 */
export interface EntityConstructor<T> {
  new(data?: Partial<T>): T;
}

/**
 * Base entity class
 */
export abstract class BaseEntity {
  /**
   * Entity ID
   */
  id: number;
  
  /**
   * Created timestamp
   */
  createdAt: Date;
  
  /**
   * Updated timestamp
   */
  updatedAt: Date;
  
  /**
   * Created by user ID
   */
  createdBy?: number;
  
  /**
   * Updated by user ID
   */
  updatedBy?: number;
  
  /**
   * Constructor
   * 
   * @param data - Initial data
   */
  constructor(data: Partial<BaseEntity> = {}) {
    this.id = data.id || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;
  }
  
  /**
   * Check if entity is new (not yet persisted)
   */
  isNew(): boolean {
    return !this.id || this.id === 0;
  }
  
  /**
   * Update entity with audit information
   * 
   * @param userId - User ID performing the update
   */
  updateAudit(userId?: number): void {
    this.updatedAt = new Date();
    
    if (userId) {
      this.updatedBy = userId;
    }
  }
  
  /**
   * Mark entity as created
   * 
   * @param userId - User ID creating the entity
   */
  markAsCreated(userId?: number): void {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    
    if (userId) {
      this.createdBy = userId;
      this.updatedBy = userId;
    }
  }
  
  /**
   * Convert entity to plain object
   */
  toObject(): Record<string, any> {
    return {
      ...this,
      // Add any custom conversion logic here
    };
  }
  
  /**
   * Create entity from plain object
   * 
   * This is a static factory method that must be implemented by each entity
   * 
   * @example
   * static fromObject<UserEntity>(data: Record<string, any>): UserEntity {
   *   return new UserEntity({
   *     ...data,
   *     createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
   *     updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
   *   });
   * }
   */
  static fromObject<T extends BaseEntity>(this: EntityConstructor<T>, data: Record<string, any>): T {
    const entity = new this();
    
    // Copy all properties from data to entity
    Object.assign(entity, data);
    
    // Convert date strings to Date objects
    if (typeof data.createdAt === 'string') {
      entity.createdAt = new Date(data.createdAt);
    }
    
    if (typeof data.updatedAt === 'string') {
      entity.updatedAt = new Date(data.updatedAt);
    }
    
    return entity;
  }
}
