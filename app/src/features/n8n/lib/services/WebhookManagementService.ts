import { ILoggingService } from '@/core/logging/ILoggingService';
import { ConfigService } from '@/core/config';
import { IErrorHandler } from '@/core/errors';
import crypto from 'crypto';

/**
 * Types for webhook management
 */
export interface WebhookRepository {
  findAll(): Promise<Webhook[]>;
  findById(id: number): Promise<Webhook | null>;
  create(webhook: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Webhook>;
  update(id: number, webhook: Partial<Webhook>): Promise<Webhook>;
  delete(id: number): Promise<void>;
}

export interface Webhook {
  id: number;
  name: string;
  description?: string;
  path: string;
  secret?: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for managing N8N webhooks
 */
export class WebhookManagementService {
  constructor(
    protected webhookRepository: WebhookRepository,
    protected logger: ILoggingService,
    protected errorHandler: IErrorHandler,
    protected configService: typeof ConfigService
  ) {}
  
  /**
   * Get all webhooks
   * 
   * @returns Array of webhooks
   */
  async getWebhooks(): Promise<Webhook[]> {
    try {
      return await this.webhookRepository.findAll();
    } catch (error) {
      this.logger.error('Error fetching webhooks', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Create a new webhook
   * 
   * @param webhook - Webhook configuration
   * @returns Created webhook
   */
  async createWebhook(webhook: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Webhook> {
    try {
      // Generate a secret for webhook verification if not provided
      if (!webhook.secret) {
        webhook.secret = this.generateWebhookSecret();
      }
      
      return await this.webhookRepository.create(webhook);
    } catch (error) {
      this.logger.error('Error creating webhook', {
        error: error instanceof Error ? error.message : String(error),
        webhook
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Update an existing webhook
   * 
   * @param id - Webhook ID
   * @param webhook - Updated webhook data
   * @returns Updated webhook
   */
  async updateWebhook(id: number, webhook: Partial<Webhook>): Promise<Webhook> {
    try {
      return await this.webhookRepository.update(id, webhook);
    } catch (error) {
      this.logger.error('Error updating webhook', {
        error: error instanceof Error ? error.message : String(error),
        id,
        webhook
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Delete a webhook
   * 
   * @param id - Webhook ID
   * @returns Operation result
   */
  async deleteWebhook(id: number): Promise<{ success: boolean }> {
    try {
      await this.webhookRepository.delete(id);
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting webhook', {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Verify a webhook signature
   * 
   * @param secret - Webhook secret
   * @param signature - Provided signature
   * @param body - Request body
   * @returns Whether the signature is valid
   */
  verifyWebhookSignature(secret: string, signature: string, body: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const computedSignature = hmac.update(body).digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      this.logger.error('Error verifying webhook signature', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  
  /**
   * Generate a random webhook secret
   * 
   * @returns Random secret string
   */
  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Standardize error handling
   * 
   * @param error - Error to handle
   * @returns Standardized error
   */
  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}