import { IPluginService } from '@/domain/services/IPluginService';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { Plugin } from '@/domain/entities/Plugin';
import {
  PluginDto,
  CreatePluginDto,
  UpdatePluginDto,
  PluginSearchDto,
  pluginToDto
} from '@/domain/dtos/PluginDtos';
import { AppError } from '@/core/errors';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export class PluginService implements IPluginService {
  constructor(
    private repository: IPluginRepository,
    private encryptionService: PluginEncryptionService,
    private pluginStoragePath: string = '/app/storage/plugins'
  ) {}

  async getById(id: number): Promise<PluginDto | null> {
    const plugin = await this.repository.findById(id);
    return plugin ? pluginToDto(plugin) : null;
  }

  async getAll(): Promise<PluginDto[]> {
    const result = await this.repository.findAll();
    return result.data.map(p => pluginToDto(p));
  }

  async create(plugin: Plugin): Promise<Plugin> {
    return this.repository.create(plugin);
  }

  async update(id: number, data: Partial<Plugin>): Promise<Plugin> {
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async createPlugin(data: CreatePluginDto, authorId: number): Promise<PluginDto> {
    // Check if plugin name already exists
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new AppError('Plugin with this name already exists', 400);
    }

    // Generate security keys
    const { publicKey, privateKey } = this.encryptionService.generateKeyPair();
    const uuid = crypto.randomUUID();

    // Create plugin entity
    const plugin = new Plugin({
      ...data,
      uuid,
      authorId,
      author: '', // Will be populated by repository
      status: 'pending',
      publicKey,
      certificate: '', // Will be set after review
      checksum: '', // Will be calculated on bundle upload
      downloads: 0,
      rating: 0,
      screenshots: [],
      tags: data.tags || [],
      pricing: data.pricing || {},
      permissions: data.permissions || [],
      dependencies: data.dependencies || []
    });

    const created = await this.repository.create(plugin);

    // Store private key securely (in production, use key management service)
    await this.storePrivateKey(created.id!, privateKey);

    return pluginToDto(created);
  }

  async updatePlugin(id: number, data: UpdatePluginDto, userId: number): Promise<PluginDto> {
    const plugin = await this.repository.findById(id);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    // Check authorization
    if (plugin.authorId !== userId && !this.isAdmin(userId)) {
      throw new AppError('Unauthorized to update this plugin', 403);
    }

    // Prevent certain updates based on status
    if (plugin.status === 'approved' && data.status !== 'suspended') {
      delete data.displayName; // Can't change name after approval
    }

    const updated = await this.repository.update(id, data);
    return pluginToDto(updated);
  }

  async submitForReview(pluginId: number, userId: number): Promise<void> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    if (plugin.authorId !== userId) {
      throw new AppError('Unauthorized to submit this plugin', 403);
    }

    if (plugin.status !== 'pending') {
      throw new AppError('Plugin must be in pending status to submit for review', 400);
    }

    // Verify plugin bundle exists
    const bundlePath = await this.getPluginBundlePath(pluginId);
    try {
      await fs.access(bundlePath);
    } catch {
      throw new AppError('Plugin bundle must be uploaded before submission', 400);
    }

    await this.repository.update(pluginId, { status: 'pending' });
  }

  async approvePlugin(pluginId: number, reviewerId: number): Promise<void> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    if (!this.isAdmin(reviewerId)) {
      throw new AppError('Only administrators can approve plugins', 403);
    }

    // Generate certificate
    const certificate = await this.generatePluginCertificate(plugin);

    await this.repository.update(pluginId, {
      status: 'approved',
      certificate
    });
  }

  async rejectPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void> {
    if (!this.isAdmin(reviewerId)) {
      throw new AppError('Only administrators can reject plugins', 403);
    }

    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    await this.repository.update(pluginId, {
      status: 'rejected',
      description: `Rejection reason: ${reason}\n\n${plugin.description || ''}`
    });
  }

  async suspendPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void> {
    if (!this.isAdmin(reviewerId)) {
      throw new AppError('Only administrators can suspend plugins', 403);
    }

    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    await this.repository.update(pluginId, {
      status: 'suspended',
      description: `Suspension reason: ${reason}\n\n${plugin.description || ''}`
    });
  }

  async searchPlugins(criteria: PluginSearchDto): Promise<{ data: PluginDto[]; total: number }> {
    const result = await this.repository.search(criteria);
    return {
      data: result.data.map(p => pluginToDto(p)),
      total: result.total
    };
  }

  async getPluginByName(name: string): Promise<PluginDto | null> {
    const plugin = await this.repository.findByName(name);
    return plugin ? pluginToDto(plugin) : null;
  }

  async getPluginByUuid(uuid: string): Promise<PluginDto | null> {
    const plugin = await this.repository.findByUuid(uuid);
    return plugin ? pluginToDto(plugin) : null;
  }

  async getPluginsByAuthor(authorId: number): Promise<PluginDto[]> {
    const plugins = await this.repository.findByAuthor(authorId);
    return plugins.map(p => pluginToDto(p));
  }

  async getPluginsByCategory(category: string): Promise<PluginDto[]> {
    const plugins = await this.repository.findByCategory(category);
    return plugins.map(p => pluginToDto(p));
  }

  async getCategories(): Promise<string[]> {
    return this.repository.getCategories();
  }

  async getTags(): Promise<string[]> {
    return this.repository.getTags();
  }

  async incrementDownloads(pluginId: number): Promise<void> {
    await this.repository.incrementDownloads(pluginId);
  }

  async uploadPluginBundle(pluginId: number, bundle: Buffer, userId: number): Promise<string> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    if (plugin.authorId !== userId) {
      throw new AppError('Unauthorized to upload bundle for this plugin', 403);
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

    return signature;
  }

  async generateSignature(pluginId: number, privateKey: string): Promise<string> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    const data = Buffer.from(JSON.stringify({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      checksum: plugin.checksum
    }));

    return this.encryptionService.signPlugin(data, privateKey);
  }

  async verifySignature(pluginId: number, signature: string): Promise<boolean> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    const data = Buffer.from(JSON.stringify({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      checksum: plugin.checksum
    }));

    return this.encryptionService.verifyPluginSignature(data, signature, plugin.publicKey);
  }

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
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY || 'dummy-key';
    const certificate = await this.encryptionService.signPlugin(
      Buffer.from(JSON.stringify(certificateData)),
      serverPrivateKey
    );

    return certificate;
  }

  private async storePrivateKey(pluginId: number, privateKey: string): Promise<void> {
    // In production, use AWS KMS, Azure Key Vault, or similar
    const keyPath = path.join(this.pluginStoragePath, 'keys', `${pluginId}.key`);
    await fs.mkdir(path.dirname(keyPath), { recursive: true });
    await fs.writeFile(keyPath, privateKey, { mode: 0o600 });
  }

  private async getPrivateKey(pluginId: number): Promise<string> {
    const keyPath = path.join(this.pluginStoragePath, 'keys', `${pluginId}.key`);
    return fs.readFile(keyPath, 'utf-8');
  }

  private async getPluginBundlePath(pluginId: number): Promise<string> {
    return path.join(this.pluginStoragePath, 'bundles', `${pluginId}.bundle`);
  }

  private isAdmin(userId: number): boolean {
    // This would check actual user permissions
    // For now, returning false
    return false;
  }
}