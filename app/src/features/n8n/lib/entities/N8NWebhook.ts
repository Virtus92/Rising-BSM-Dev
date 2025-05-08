import { BaseEntity } from '@/domain/entities/BaseEntity';

/**
 * Webhook configuration for N8N integration
 */
export class N8NWebhook extends BaseEntity {
  name: string;
  description?: string;
  path: string;
  secret?: string;
  events: string[];
  enabled: boolean;
  
  constructor(data: Partial<N8NWebhook>) {
    super(data);
    this.name = data.name || '';
    this.description = data.description;
    this.path = data.path || '';
    this.secret = data.secret;
    this.events = data.events || [];
    this.enabled = data.enabled ?? true;
  }
  
  /**
   * Get the full webhook URL
   * 
   * @param baseUrl - Base URL for the application
   * @returns Full webhook URL
   */
  getFullUrl(baseUrl: string): string {
    return `${baseUrl}/api/webhooks/n8n/${this.path}`;
  }
}