import { BaseEntity } from '@/domain/entities/BaseEntity';

/**
 * Configuration for N8N integration
 */
export class N8NConfiguration extends BaseEntity {
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
  
  constructor(data: Partial<N8NConfiguration>) {
    super(data);
    this.baseUrl = data.baseUrl || '';
    this.apiKey = data.apiKey;
    this.enabled = data.enabled ?? true;
  }
  
  /**
   * Check if the configuration is valid
   */
  isValid(): boolean {
    return !!this.baseUrl;
  }
}