import 'server-only';

import { IPluginService } from '@/domain/services/IPluginService';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { ILoggingService } from '@/core/logging';
import { IValidationService } from '@/core/validation';
import { IActivityLogService } from '@/domain/services/IActivityLogService';
import { IAutomationService } from '@/domain/services/IAutomationService';
import { ServiceError } from '@/core/errors';
import { Plugin } from '@/domain/entities/Plugin';
import {
  PluginDto,
  CreatePluginDto,
  UpdatePluginDto,
  PluginSearchDto,
  pluginToDto
} from '@/domain/dtos/PluginDtos';
import { ValidationResultDto } from '@/domain/dtos/ValidationDto';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Server-side implementation of PluginService
 * Handles all plugin-related business logic with proper security and repository integration
 */
export class PluginService implements IPluginService {
  private pluginStoragePath: string;

  constructor(
    private repository: IPluginRepository,
    private logger: ILoggingService,
    private validator: IValidationService,
    private activityLog: IActivityLogService,
    private automationService: IAutomationService,
    private encryptionService: PluginEncryptionService
  ) {
    this.pluginStoragePath = process.env.PLUGIN_STORAGE_PATH || '/app/storage/plugins';
  }

  async getById(id: number): Promise<PluginDto | null> {
    try {
      const plugin = await this.repository.findById(id);
      return plugin ? pluginToDto(plugin) : null;
    } catch (error) {
      this.logger.error('Failed to get plugin by ID', { error, id });
      throw error;
    }
  }

  async getAll(options?: ServiceOptions): Promise<PaginationResult<PluginDto>> {
    try {
      const result = await this.repository.findAll({
        page: options?.page,
        limit: options?.limit,
        sort: options?.sort
      });
      
      return {
        data: result.data.map(p => pluginToDto(p)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Failed to get all plugins', { error });
      throw error;
    }
  }

  async create(data: CreatePluginDto, options?: ServiceOptions): Promise<PluginDto> {
    try {
      // Validate plugin data
      const validation = await this.validate(data as any);
      if (!validation.isValid) {
        throw new ServiceError('Validation failed', 400, validation.errors);
      }

      // Check if plugin name already exists
      const existing = await this.repository.findByName(data.name);
      if (existing) {
        throw new ServiceError('Plugin with this name already exists', 409);
      }

      // Generate security keys
      const { publicKey, privateKey } = await this.encryptionService.generateKeyPair();
      const uuid = crypto.randomUUID();

      // Create plugin entity
      const plugin = new Plugin({
        ...data,
        uuid,
        authorId: options?.context?.userId || 0,
        author: '',
        status: 'pending',
        publicKey,
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        screenshots: data.screenshots || [],
        tags: data.tags || [],
        pricing: data.pricing || {},
        permissions: data.permissions || [],
        dependencies: data.dependencies || []
      });

      const created = await this.repository.create(plugin);

      // Store private key securely
      await this.storePrivateKey(created.id!, privateKey);

      // Log activity
      await this.activityLog.log({
        userId: options?.context?.userId || 0,
        action: 'plugin.created',
        entityType: 'Plugin',
        entityId: created.id!,
        metadata: { pluginName: created.name }
      });

      // Trigger automation
      await this.automationService.triggerEvent('plugin.created', {
        pluginId: created.id,
        pluginName: created.name,
        authorId: created.authorId
      });

      return pluginToDto(created);
    } catch (error) {
      this.logger.error('Failed to create plugin', { error, data });
      throw error;
    }
  }

  async update(id: number, data: Partial<Plugin>, options?: ServiceOptions): Promise<PluginDto> {
    try {
      const plugin = await this.repository.findById(id);
      if (!plugin) {
        throw new ServiceError('Plugin not found', 404);
      }

      // Check authorization
      const userId = options?.context?.userId || 0;
      if (plugin.authorId !== userId && !options?.context?.isAdmin) {
        throw new ServiceError('Unauthorized to update this plugin', 403);
      }

      // Validate update data
      const validation = await this.validate(data, true, id);
      if (!validation.isValid) {
        throw new ServiceError('Validation failed', 400, validation.errors);
      }

      // Prevent certain updates based on status
      if (plugin.status === 'approved' && data.status !== 'suspended') {
        delete data.displayName; // Can't change name after approval
        delete data.name;
      }

      const updated = await this.repository.update(id, data);

      // Log activity
      await this.activityLog.log({
        userId,
        action: 'plugin.updated',
        entityType: 'Plugin',
        entityId: id,
        metadata: { changes: Object.keys(data) }
      });

      // Trigger automation
      await this.automationService.triggerEvent('plugin.updated', {
        pluginId: id,
        changes: data
      });

      return pluginToDto(updated);
    } catch (error) {
      this.logger.error('Failed to update plugin', { error, id, data });
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const plugin = await this.repository.findById(id);
      if (!plugin) {
        throw new ServiceError('Plugin not found', 404);
      }

      // Delete associated files
      try {
        const bundlePath = await this.getPluginBundlePath(id);
        await fs.unlink(bundlePath);
      } catch (error) {
        // File might not exist
        this.logger.warn('Failed to delete plugin bundle', { error, id });
      }

      const result = await this.repository.delete(id);

      // Log activity
      await this.activityLog.log({
        userId: 0, // System action
        action: 'plugin.deleted',
        entityType: 'Plugin',
        entityId: id,
        metadata: { pluginName: plugin.name }
      });

      // Trigger automation
      await this.automationService.triggerEvent('plugin.deleted', {
        pluginId: id,
        pluginName: plugin.name
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to delete plugin', { error, id });
      throw error;
    }
  }

  async createPlugin(data: CreatePluginDto, authorId: number): Promise<PluginDto> {
    return this.create(data, { context: { userId: authorId } });
  }

  async updatePlugin(id: number, data: UpdatePluginDto, userId: number): Promise<PluginDto> {
    return this.update(id, data as any, { context: { userId } });
  }

  async submitForReview(pluginId: number, userId: number): Promise<void> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new ServiceError('Plugin not found', 404);
      }

      if (plugin.authorId !== userId) {
        throw new ServiceError('Unauthorized to submit this plugin', 403);
      }

      if (plugin.status !== 'pending') {
        throw new ServiceError('Plugin must be in pending status to submit for review', 400);
      }

      // Verify plugin bundle exists
      const bundlePath = await this.getPluginBundlePath(pluginId);
      try {
        await fs.access(bundlePath);
      } catch {
        throw new ServiceError('Plugin bundle must be uploaded before submission', 400);
      }

      await this.repository.update(pluginId, { status: 'review' });

      // Log activity
      await this.activityLog.log({
        userId,
        action: 'plugin.submitted_for_review',
        entityType: 'Plugin',
        entityId: pluginId
      });
    } catch (error) {
      this.logger.error('Failed to submit plugin for review', { error, pluginId });
      throw error;
    }
  }

  async approvePlugin(pluginId: number, reviewerId: number): Promise<void> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new ServiceError('Plugin not found', 404);
      }

      // Generate certificate
      const certificate = await this.generatePluginCertificate(plugin);

      await this.repository.update(pluginId, {
        status: 'approved',
        certificate
      });

      // Log activity
      await this.activityLog.log({
        userId: reviewerId,
        action: 'plugin.approved',
        entityType: 'Plugin',
        entityId: pluginId
      });

      // Trigger automation
      await this.automationService.triggerEvent('plugin.approved', {
        pluginId,
        pluginName: plugin.name,
        authorId: plugin.authorId
      });
    } catch (error) {
      this.logger.error('Failed to approve plugin', { error, pluginId });
      throw error;
    }
  }

  async rejectPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new ServiceError('Plugin not found', 404);
      }

      await this.repository.update(pluginId, {
        status: 'rejected',
        description: plugin.description ? `${plugin.description}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`
      });

      // Log activity
      await this.activityLog.log({
        userId: reviewerId,
        action: 'plugin.rejected',
        entityType: 'Plugin',
        entityId: pluginId,
        metadata: { reason }
      });

      // Trigger automation
      await this.automationService.triggerEvent('plugin.rejected', {
        pluginId,
        pluginName: plugin.name,
        authorId: plugin.authorId,
        reason
      });
    } catch (error) {
      this.logger.error('Failed to reject plugin', { error, pluginId });
      throw error;
    }
  }

  async suspendPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new ServiceError('Plugin not found', 404);
      }

      await this.repository.update(pluginId, {
        status: 'suspended'
      });

      // Log activity
      await this.activityLog.log({
        userId: reviewerId,
        action: 'plugin.suspended',
        entityType: 'Plugin',
        entityId: pluginId,
        metadata: { reason }
      });

      // Trigger automation
      await this.automationService.triggerEvent('plugin.suspended', {
        pluginId,
        pluginName: plugin.name,
        reason
      });
    } catch (error) {
      this.logger.error('Failed to suspend plugin', { error, pluginId });
      throw error;
    }
  }

  async searchPlugins(criteria: PluginSearchDto): Promise<{ data: PluginDto[]; total: number }> {
    try {
      const result = await this.repository.search(criteria);
      return {
        data: result.data.map(p => pluginToDto(p)),
        total: result.total
      };
    } catch (error) {
      this.logger.error('Failed to search plugins', { error, criteria });
      throw error;
    }
  }

  async getPluginByName(name: string): Promise<PluginDto | null> {
    try {
      const plugin = await this.repository.findByName(name);
      return plugin ? pluginToDto(plugin) : null;
    } catch (error) {
      this.logger.error('Failed to get plugin by name', { error, name });
      throw error;
    }
  }

  async getPluginByUuid(uuid: string): Promise<PluginDto | null> {
    try {
      const plugin = await this.repository.findByUuid(uuid);
      return plugin ? pluginToDto(plugin) : null;
    } catch (error) {
      this.logger.error('Failed to get plugin by UUID', { error, uuid });
      throw error;
    }
  }

  async getPluginsByAuthor(authorId: number): Promise<PluginDto[]> {
    try {
      const plugins = await this.repository.findByAuthor(authorId);
      return plugins.map(p => pluginToDto(p));
    } catch (error) {
      this.logger.error('Failed to get plugins by author', { error, authorId });
      throw error;
    }
  }

  async getPluginsByCategory(category: string): Promise<PluginDto[]> {
    try {
      const plugins = await this.repository.findByCategory(category);
      return plugins.map(p => pluginToDto(p));
    } catch (error) {
      this.logger.error('Failed to get plugins by category', { error, category });
      throw error;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      return await this.repository.getCategories();
    } catch (error) {
      this.logger.error('Failed to get categories', { error });
      throw error;
    }
  }

  async getTags(): Promise<string[]> {
    try {
      return await this.repository.getTags();
    } catch (error) {
      this.logger.error('Failed to get tags', { error });
      throw error;
    }
  }

  async incrementDownloads(pluginId: number): Promise<void> {
    try {
      await this.repository.incrementDownloads(pluginId);
    } catch (error) {
      this.logger.error('Failed to increment downloads', { error, pluginId });
      throw error;
    }
  }

  async uploadPluginBundle(pluginId: number, bundle: Buffer, userId: number): Promise<string> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new ServiceError('Plugin not found', 404);
      }

      if (plugin.authorId !== userId) {
        throw new ServiceError('Unauthorized to upload bundle for this plugin', 403);
      }

      // Calculate checksum
      const checksum = await this.encryptionService.calculateChecksum(bundle);

      // Sign the bundle
      const privateKey = await this.getPrivateKey(pluginId);
      const signature = await this.encryptionService.signPlugin(bundle, privateKey);

      // Store bundle
      const bundlePath = await this.getPluginBundlePath(pluginId);
      await fs.mkdir(path.dirname(bundlePath), { recursive: true });
      await fs.writeFile(bundlePath, bundle);

      // Update plugin checksum
      await this.repository.update(pluginId, { checksum });

      // Log activity
      await this.activityLog.log({
        userId,
        action: 'plugin.bundle_uploaded',
        entityType: 'Plugin',
        entityId: pluginId,
        metadata: { checksum, size: bundle.length }
      });

      return signature;
    } catch (error) {
      this.logger.error('Failed to upload plugin bundle', { error, pluginId });
      throw error;
    }
  }

  async generateSignature(pluginId: number, privateKey: string): Promise<string> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new ServiceError('Plugin not found', 404);
      }

      const data = Buffer.from(JSON.stringify({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        checksum: plugin.checksum
      }));

      return await this.encryptionService.signPlugin(data, privateKey);
    } catch (error) {
      this.logger.error('Failed to generate signature', { error, pluginId });
      throw error;
    }
  }

  async verifySignature(pluginId: number, signature: string): Promise<boolean> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new ServiceError('Plugin not found', 404);
      }

      const data = Buffer.from(JSON.stringify({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        checksum: plugin.checksum
      }));

      return await this.encryptionService.verifyPluginSignature(data, signature, plugin.publicKey);
    } catch (error) {
      this.logger.error('Failed to verify signature', { error, pluginId });
      throw error;
    }
  }

  // Additional methods required by IBaseService
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      return await this.repository.count(options?.filters || {});
    } catch (error) {
      this.logger.error('Failed to count plugins', { error });
      throw error;
    }
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<PluginDto[]> {
    try {
      const plugins = await this.repository.findByCriteria(criteria);
      return plugins.map(p => pluginToDto(p));
    } catch (error) {
      this.logger.error('Failed to find plugins by criteria', { error, criteria });
      throw error;
    }
  }

  async validate(data: Partial<Plugin>, isUpdate?: boolean, entityId?: number): Promise<ValidationResultDto> {
    const validationData = {
      ...data,
      __entity: 'plugin',
      __isUpdate: isUpdate,
      __entityId: entityId
    };

    return await this.validator.validate(validationData, 'plugin');
  }

  async transaction<R>(callback: (service: IPluginService) => Promise<R>): Promise<R> {
    // In a real implementation, this would handle database transactions
    return callback(this);
  }

  async bulkUpdate(ids: number[], data: Partial<Plugin>, options?: ServiceOptions): Promise<number> {
    let updated = 0;
    for (const id of ids) {
      try {
        await this.update(id, data, options);
        updated++;
      } catch (error) {
        this.logger.warn('Failed to update plugin in bulk operation', { error, id });
      }
    }
    return updated;
  }

  toDTO(entity: Plugin): PluginDto {
    return pluginToDto(entity);
  }

  fromDTO(dto: Partial<Plugin>): Partial<Plugin> {
    return dto;
  }

  async search(searchText: string, options?: ServiceOptions): Promise<PluginDto[]> {
    const result = await this.searchPlugins({
      query: searchText,
      page: options?.page || 1,
      limit: options?.limit || 20
    });
    return result.data;
  }

  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const plugin = await this.repository.findById(id);
      return plugin !== null;
    } catch (error) {
      this.logger.error('Failed to check plugin existence', { error, id });
      throw error;
    }
  }

  getRepository(): IPluginRepository {
    return this.repository;
  }

  async findAll(options?: ServiceOptions): Promise<PaginationResult<PluginDto>> {
    return this.getAll(options);
  }

  // Private helper methods
  private async generatePluginCertificate(plugin: Plugin): Promise<string> {
    const certificateData = {
      pluginId: plugin.id,
      pluginName: plugin.name,
      pluginVersion: plugin.version,
      authorId: plugin.authorId,
      approvedAt: new Date().toISOString(),
      publicKey: plugin.publicKey
    };

    // In production, this would use a proper certificate authority
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY || await this.generateServerKey();
    const certificate = await this.encryptionService.signPlugin(
      Buffer.from(JSON.stringify(certificateData)),
      serverPrivateKey
    );

    return certificate;
  }

  private async generateServerKey(): Promise<string> {
    // Generate a server key if not configured
    const { privateKey } = await this.encryptionService.generateKeyPair();
    return privateKey;
  }

  private async storePrivateKey(pluginId: number, privateKey: string): Promise<void> {
    // In production, use AWS KMS, Azure Key Vault, or similar
    const keyPath = path.join(this.pluginStoragePath, 'keys', `${pluginId}.key`);
    await fs.mkdir(path.dirname(keyPath), { recursive: true });
    await fs.writeFile(keyPath, privateKey, { mode: 0o600 });
  }

  private async getPrivateKey(pluginId: number): Promise<string> {
    const keyPath = path.join(this.pluginStoragePath, 'keys', `${pluginId}.key`);
    try {
      return await fs.readFile(keyPath, 'utf-8');
    } catch (error) {
      throw new ServiceError('Private key not found for plugin', 404);
    }
  }

  private async getPluginBundlePath(pluginId: number): Promise<string> {
    return path.join(this.pluginStoragePath, 'bundles', `${pluginId}.bundle`);
  }
}