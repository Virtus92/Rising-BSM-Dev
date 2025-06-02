/**
 * Marketplace Connector for dinel.at
 * 
 * This connector handles all marketplace operations including:
 * - Plugin publishing and distribution
 * - License management and verification
 * - Payment processing
 * - Download token generation
 */

import { getLogger } from '@/core/logging';
import { AppError } from '@/core/errors';
import { Plugin } from '@/domain/entities/Plugin';
import { PluginLicense } from '@/domain/entities/PluginLicense';
import { 
  PluginDto, 
  PluginLicenseDto, 
  CreatePluginDto,
  PluginSearchDto,
  VerifyLicenseDto,
  GenerateLicenseDto
} from '@/domain/dtos/PluginDtos';

export interface MarketplaceConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  webhookSecret?: string;
}

export interface MarketplacePlugin {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  authorId: string;
  category: string;
  tags: string[];
  icon?: string;
  screenshots: string[];
  pricing: Record<string, number>;
  downloads: number;
  rating: number;
  status: string;
  bundleUrl?: string;
  checksum?: string;
}

export interface MarketplaceLicense {
  id: string;
  licenseKey: string;
  pluginId: string;
  userId: string;
  type: string;
  status: string;
  expiresAt?: Date;
  hardwareId?: string;
  maxInstalls: number;
  currentInstalls: number;
}

export interface DownloadToken {
  token: string;
  url: string;
  expiresAt: Date;
}

export class MarketplaceConnector {
  private config: MarketplaceConfig | null = null;
  private logger = getLogger();
  private isConfigured: boolean = false;

  constructor(config?: MarketplaceConfig) {
    if (config) {
      this.config = config;
      this.isConfigured = true;
    } else {
      try {
        this.config = this.loadConfig();
        this.isConfigured = true;
      } catch (error) {
        // Log warning but don't throw - allow system to run without marketplace
        this.logger.warn('Marketplace API credentials not configured. Marketplace features will be disabled.');
        this.isConfigured = false;
      }
    }
  }

  private loadConfig(): MarketplaceConfig {
    // Load from environment variables
    const apiUrl = process.env.MARKETPLACE_API_URL || 'https://api.dinel.at/v1';
    const apiKey = process.env.MARKETPLACE_API_KEY;
    const apiSecret = process.env.MARKETPLACE_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new AppError('Marketplace API credentials not configured', 500);
    }

    return {
      apiUrl,
      apiKey,
      apiSecret,
      webhookSecret: process.env.MARKETPLACE_WEBHOOK_SECRET
    };
  }

  /**
   * Check if marketplace is configured
   */
  public isMarketplaceConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Ensure marketplace is configured before making requests
   */
  private ensureConfigured(): void {
    if (!this.isConfigured || !this.config) {
      throw new AppError('Marketplace integration is not configured. Please set MARKETPLACE_API_KEY and MARKETPLACE_API_SECRET environment variables.', 503);
    }
  }

  /**
   * Generate authorization header for marketplace API
   */
  private getAuthHeader(): string {
    this.ensureConfigured();
    const timestamp = Date.now();
    const signature = this.generateSignature(timestamp);
    return `Bearer ${this.config!.apiKey}:${signature}:${timestamp}`;
  }

  /**
   * Generate HMAC signature for API requests
   */
  private generateSignature(timestamp: number): string {
    this.ensureConfigured();
    const crypto = require('crypto');
    const message = `${this.config!.apiKey}:${timestamp}`;
    return crypto
      .createHmac('sha256', this.config!.apiSecret)
      .update(message)
      .digest('hex');
  }

  /**
   * Make authenticated request to marketplace API
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    this.ensureConfigured();
    const url = `${this.config!.apiUrl}${endpoint}`;
    const headers = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
      'X-Client-Version': '1.0.0'
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new AppError(
          error.message || `Marketplace API error: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Marketplace API request failed', error as Error);
      throw error;
    }
  }

  /**
   * Search plugins in the marketplace
   */
  async searchPlugins(criteria: PluginSearchDto): Promise<{
    data: MarketplacePlugin[];
    total: number;
  }> {
    this.ensureConfigured();
    return this.request('GET', '/plugins', criteria);
  }

  /**
   * Get plugin details from marketplace
   */
  async getPlugin(pluginId: string): Promise<MarketplacePlugin> {
    return this.request('GET', `/plugins/${pluginId}`);
  }

  /**
   * Publish a plugin to the marketplace
   */
  async publishPlugin(
    plugin: Plugin,
    bundleData: Buffer,
    metadata: {
      changelog?: string;
      releaseNotes?: string;
    }
  ): Promise<MarketplacePlugin> {
    const formData = new FormData();
    
    // Add plugin data
    formData.append('plugin', JSON.stringify({
      name: plugin.name,
      displayName: plugin.displayName,
      description: plugin.description,
      version: plugin.version,
      author: plugin.author,
      authorId: plugin.authorId,
      category: plugin.category,
      tags: plugin.tags,
      icon: plugin.icon,
      screenshots: plugin.screenshots,
      pricing: plugin.pricing,
      permissions: plugin.permissions,
      dependencies: plugin.dependencies,
      minAppVersion: plugin.minAppVersion,
      maxAppVersion: plugin.maxAppVersion,
      certificate: plugin.certificate,
      publicKey: plugin.publicKey,
      checksum: plugin.checksum,
      ...metadata
    }));

    // Add bundle file
    formData.append('bundle', new Blob([bundleData]), 'plugin.bundle');

    // Make request with multipart form data
    const url = `${this.config.apiUrl}/plugins`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader()
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new AppError(error.message || 'Failed to publish plugin', response.status);
    }

    return await response.json();
  }

  /**
   * Update plugin in marketplace
   */
  async updatePlugin(
    pluginId: string,
    updates: Partial<MarketplacePlugin>
  ): Promise<MarketplacePlugin> {
    return this.request('PUT', `/plugins/${pluginId}`, updates);
  }

  /**
   * Delete plugin from marketplace
   */
  async deletePlugin(pluginId: string): Promise<void> {
    await this.request('DELETE', `/plugins/${pluginId}`);
  }

  /**
   * Generate a license through marketplace
   */
  async generateLicense(data: GenerateLicenseDto): Promise<MarketplaceLicense> {
    return this.request('POST', '/licenses', data);
  }

  /**
   * Verify a license with marketplace
   */
  async verifyLicense(data: VerifyLicenseDto): Promise<{
    valid: boolean;
    license?: MarketplaceLicense;
    error?: string;
  }> {
    try {
      const result = await this.request<any>('POST', '/licenses/verify', data);
      return result;
    } catch (error) {
      // Handle offline verification
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get download token for a plugin
   */
  async getDownloadToken(
    pluginId: string,
    licenseKey: string,
    hardwareId: string
  ): Promise<DownloadToken> {
    return this.request('POST', `/plugins/${pluginId}/download`, {
      licenseKey,
      hardwareId
    });
  }

  /**
   * Download plugin bundle
   */
  async downloadPlugin(token: string): Promise<Buffer> {
    const response = await fetch(`${this.config.apiUrl}/download/${token}`, {
      headers: {
        'Authorization': this.getAuthHeader()
      }
    });

    if (!response.ok) {
      throw new AppError('Failed to download plugin', response.status);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Get user's licenses from marketplace
   */
  async getUserLicenses(userId: string): Promise<MarketplaceLicense[]> {
    return this.request('GET', `/users/${userId}/licenses`);
  }

  /**
   * Transfer license to another user
   */
  async transferLicense(
    licenseKey: string,
    newUserId: string
  ): Promise<MarketplaceLicense> {
    return this.request('POST', `/licenses/${licenseKey}/transfer`, {
      newUserId
    });
  }

  /**
   * Revoke a license
   */
  async revokeLicense(
    licenseKey: string,
    reason: string
  ): Promise<MarketplaceLicense> {
    return this.request('POST', `/licenses/${licenseKey}/revoke`, {
      reason
    });
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<{
    totalPlugins: number;
    totalDownloads: number;
    totalRevenue: number;
    topPlugins: MarketplacePlugin[];
  }> {
    return this.request('GET', '/stats');
  }

  /**
   * Get plugin statistics
   */
  async getPluginStats(pluginId: string): Promise<{
    downloads: number;
    revenue: number;
    activeInstalls: number;
    ratings: {
      average: number;
      count: number;
    };
  }> {
    return this.request('GET', `/plugins/${pluginId}/stats`);
  }

  /**
   * Submit plugin review
   */
  async submitReview(
    pluginId: string,
    userId: string,
    rating: number,
    comment: string
  ): Promise<void> {
    await this.request('POST', `/plugins/${pluginId}/reviews`, {
      userId,
      rating,
      comment
    });
  }

  /**
   * Get plugin reviews
   */
  async getReviews(
    pluginId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: Array<{
      id: string;
      userId: string;
      userName: string;
      rating: number;
      comment: string;
      createdAt: Date;
    }>;
    total: number;
  }> {
    return this.request('GET', `/plugins/${pluginId}/reviews`, {
      page,
      limit
    });
  }

  /**
   * Process marketplace webhook
   */
  async processWebhook(
    signature: string,
    payload: any
  ): Promise<void> {
    if (!this.config.webhookSecret) {
      throw new AppError('Webhook secret not configured', 500);
    }

    // Verify webhook signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new AppError('Invalid webhook signature', 401);
    }

    // Process webhook event
    switch (payload.event) {
      case 'license.created':
      case 'license.updated':
      case 'license.revoked':
      case 'plugin.downloaded':
      case 'plugin.reviewed':
        // These events can be handled by the local system if needed
        this.logger.info(`Marketplace webhook: ${payload.event}`, payload);
        break;
      default:
        this.logger.warn(`Unknown webhook event: ${payload.event}`);
    }
  }

  /**
   * Check marketplace connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request<{ status: string }>('GET', '/health');
      return response.status === 'ok';
    } catch {
      return false;
    }
  }
}

// Export singleton instance - will be null if not configured
let marketplaceConnectorInstance: MarketplaceConnector | null = null;

try {
  marketplaceConnectorInstance = new MarketplaceConnector();
} catch (error) {
  // Marketplace not configured - this is okay
  getLogger().info('Marketplace connector not initialized - marketplace features disabled');
}

export const marketplaceConnector = marketplaceConnectorInstance;
