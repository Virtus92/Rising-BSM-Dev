export class Permission {
    id: number;
    name: string;
    description: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(data: Partial<Permission> = {}) {
      this.id = data.id || 0;
      this.name = data.name || '';
      this.description = data.description || '';
      this.category = data.category || 'general';
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = data.updatedAt || new Date();
    }
  }