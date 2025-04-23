import { BaseEntity } from './BaseEntity';

/**
 * Permission Entity
 * 
 * Represents a system permission that can be assigned to users.
 */
export class Permission extends BaseEntity {
  /**
   * Permission code/key (e.g., 'users.view')
   */
  code: string;
  
  /**
   * Display name
   */
  name: string;
  
  /**
   * Description
   */
  description: string;
  
  /**
   * Category for grouping permissions
   */
  category: string;
  
  /**
   * Constructor
   * 
   * @param data - Initialization data
   */
  constructor(data: Partial<Permission> = {}) {
    super(data);
    
    this.code = data.code || '';
    this.name = data.name || '';
    this.description = data.description || '';
    this.category = data.category || 'General';
  }
  
  /**
   * Validates the permission code format
   */
  isValidCode(): boolean {
    // Permission code should be in format: category.action
    // E.g., users.view, roles.edit
    const codeRegex = /^[a-z]+\.[a-z]+$/;
    return codeRegex.test(this.code);
  }
}

/**
 * User Permission Entity
 * 
 * Represents a many-to-many relationship between users and permissions.
 */
export class UserPermission {
  /**
   * User ID
   */
  userId: number;
  
  /**
   * Permission ID
   */
  permissionId: number;
  
  /**
   * When the permission was granted or denied
   */
  grantedAt: Date;
  
  /**
   * Who granted the permission
   */
  grantedBy?: number;
  
  /**
   * Whether this is explicitly denied
   * When true, this permission is explicitly denied even if granted by role
   */
  isDenied: boolean;
  
  /**
   * Constructor
   * 
   * @param data - Initialization data
   */
  constructor(data: Partial<UserPermission> = {}) {
    if (!data.userId || data.userId <= 0) {
      throw new Error('UserPermission requires a valid userId');
    }
    
    if (!data.permissionId || data.permissionId <= 0) {
      throw new Error('UserPermission requires a valid permissionId');
    }
    
    this.userId = data.userId;
    this.permissionId = data.permissionId;
    this.grantedAt = data.grantedAt || new Date();
    this.grantedBy = data.grantedBy;
    this.isDenied = data.isDenied || false;
  }
  
  /**
   * Creates a granted permission
   */
  static grant(userId: number, permissionId: number, grantedBy?: number): UserPermission {
    return new UserPermission({
      userId,
      permissionId,
      grantedAt: new Date(),
      grantedBy,
      isDenied: false
    });
  }
  
  /**
   * Creates a denied permission override
   */
  static deny(userId: number, permissionId: number, grantedBy?: number): UserPermission {
    return new UserPermission({
      userId,
      permissionId,
      grantedAt: new Date(),
      grantedBy,
      isDenied: true
    });
  }
}
