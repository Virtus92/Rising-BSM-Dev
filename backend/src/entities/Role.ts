
  export class Role {
    id: number;
    name: string;
    description: string;
    isSystem: boolean;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy?: number;
    updatedBy?: number;
  
    constructor(data: Partial<Role> = {}) {
      this.id = data.id || 0;
      this.name = data.name || '';
      this.description = data.description || '';
      this.isSystem = data.isSystem || false;
      this.permissions = data.permissions || [];
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = data.updatedAt || new Date();
      this.createdBy = data.createdBy;
      this.updatedBy = data.updatedBy;
    }
  
    hasPermission(permission: string): boolean {
      return this.permissions.includes(permission);
    }
  
    addPermission(permission: string): void {
      if (!this.hasPermission(permission)) {
        this.permissions.push(permission);
      }
    }
  
    removePermission(permission: string): void {
      this.permissions = this.permissions.filter(p => p !== permission);
    }
  }