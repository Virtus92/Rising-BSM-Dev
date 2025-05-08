import { BaseEntity } from '@/domain/entities/BaseEntity';

/**
 * API endpoint registry for N8N integration
 */
export class N8NApiEndpoint extends BaseEntity {
  path: string;
  method: string;
  description?: string;
  parameters?: any;
  responseFormat?: any;
  isPublic: boolean;
  isDeprecated: boolean;
  
  constructor(data: Partial<N8NApiEndpoint>) {
    super(data);
    this.path = data.path || '';
    this.method = data.method || 'GET';
    this.description = data.description;
    this.parameters = data.parameters;
    this.responseFormat = data.responseFormat;
    this.isPublic = data.isPublic ?? false;
    this.isDeprecated = data.isDeprecated ?? false;
  }
}