import { Plugin } from '@/domain/entities/Plugin';
import { PluginBundle, PluginBundleUtils } from '../core/PluginBundle';
import { ILoggingService } from '@/core/logging';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import { IPluginLicenseService } from '@/domain/services/IPluginLicenseService';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export interface DistributionConfig {
  storageRoot: string;
  cdnUrl?: string;
  maxBundleSize: number; // MB
  allowedFileTypes: string[];
  signatureRequired: boolean;
}

export interface DownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
}

export interface BundleMetadata {
  bundleId: string;
  pluginId: number;
  version: string;
  size: number;
  checksum: string;
  uploadedAt: Date;
  downloadCount: number;
  cdnUrl?: string;
  storageUrl: string;
}

/**
 * Service for managing plugin distribution, downloads, and storage
 */
export class PluginDistributionService {
  private readonly config: DistributionConfig;

  constructor(
    private readonly logger: ILoggingService,
    private readonly encryptionService: PluginEncryptionService,
    private readonly licenseService: IPluginLicenseService,
    config?: Partial<DistributionConfig>
  ) {
    this.config = {
      storageRoot: config?.storageRoot || process.env.PLUGIN_STORAGE_ROOT || './storage/plugins',
      cdnUrl: config?.cdnUrl || process.env.PLUGIN_CDN_URL,
      maxBundleSize: config?.maxBundleSize || 100, // 100MB default
      allowedFileTypes: config?.allowedFileTypes || [
        '.js', '.ts', '.jsx', '.tsx', '.json', '.css', '.scss',
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
        '.woff', '.woff2', '.ttf', '.eot'
      ],
      signatureRequired: config?.signatureRequired !== false
    };
  }

  /**
   * Upload a plugin bundle to storage
   */
  async uploadBundle(
    plugin: Plugin,
    bundle: PluginBundle,
    signature?: string
  ): Promise<BundleMetadata> {
    try {
      // Validate bundle
      PluginBundleUtils.validateBundle(bundle);

      // Serialize bundle
      const bundleBuffer = await PluginBundleUtils.serializeBundle(bundle);
      
      // Check size
      const sizeMB = bundleBuffer.length / (1024 * 1024);
      if (sizeMB > this.config.maxBundleSize) {
        throw new Error(`Bundle size ${sizeMB.toFixed(2)}MB exceeds limit of ${this.config.maxBundleSize}MB`);
      }

      // Verify signature if required
      if (this.config.signatureRequired && signature) {
        const publicKey = await this.getPublicKey(plugin.authorId);
        const isValid = await PluginBundleUtils.verifyBundleSignature(
          bundle,
          signature,
          publicKey
        );
        if (!isValid) {
          throw new Error('Invalid bundle signature');
        }
      }

      // Generate bundle ID
      const bundleId = this.generateBundleId(plugin.id, bundle.manifest.version);
      
      // Create storage path
      const storagePath = await this.createStoragePath(plugin.id, bundle.manifest.version);
      const bundleFile = path.join(storagePath, `${bundleId}.rbsm`);
      const metadataFile = path.join(storagePath, `${bundleId}.meta.json`);

      // Write bundle to storage
      await fs.writeFile(bundleFile, bundleBuffer);

      // Create and save metadata
      const metadata: BundleMetadata = {
        bundleId,
        pluginId: plugin.id,
        version: bundle.manifest.version,
        size: bundleBuffer.length,
        checksum: crypto.createHash('sha256').update(bundleBuffer).digest('hex'),
        uploadedAt: new Date(),
        downloadCount: 0,
        storageUrl: bundleFile,
        cdnUrl: this.config.cdnUrl ? `${this.config.cdnUrl}/plugins/${plugin.id}/${bundle.manifest.version}/${bundleId}.rbsm` : undefined
      };

      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));

      this.logger.info(`Uploaded plugin bundle`, {
        pluginId: plugin.id,
        version: bundle.manifest.version,
        bundleId,
        size: sizeMB.toFixed(2) + 'MB'
      });

      return metadata;
    } catch (error) {
      this.logger.error('Failed to upload plugin bundle', { error });
      throw error;
    }
  }

  /**
   * Download a plugin bundle
   */
  async downloadBundle(
    pluginId: number,
    version: string,
    licenseKey?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<PluginBundle> {
    try {
      // Get bundle metadata
      const metadata = await this.getBundleMetadata(pluginId, version);
      if (!metadata) {
        throw new Error(`Bundle not found for plugin ${pluginId} version ${version}`);
      }

      // Verify license if provided
      if (licenseKey) {
        const isValid = await this.licenseService.verifyLicenseForDistribution(licenseKey, pluginId);
        if (!isValid) {
          throw new Error('Invalid license key');
        }
      }

      // Download from CDN if available, otherwise from local storage
      const bundleUrl = metadata.cdnUrl || metadata.storageUrl;
      const bundleBuffer = await this.downloadFile(bundleUrl, metadata.size, onProgress);

      // Verify checksum
      const checksum = crypto.createHash('sha256').update(bundleBuffer).digest('hex');
      if (checksum !== metadata.checksum) {
        throw new Error('Bundle checksum verification failed');
      }

      // Deserialize bundle
      const bundle = await PluginBundleUtils.deserializeBundle(bundleBuffer);

      // Update download count
      await this.incrementDownloadCount(metadata);

      this.logger.info(`Downloaded plugin bundle`, {
        pluginId,
        version,
        bundleId: metadata.bundleId
      });

      return bundle;
    } catch (error) {
      this.logger.error('Failed to download plugin bundle', { error });
      throw error;
    }
  }

  /**
   * Get available versions for a plugin
   */
  async getAvailableVersions(pluginId: number): Promise<string[]> {
    try {
      const pluginPath = path.join(this.config.storageRoot, pluginId.toString());
      
      // Check if plugin directory exists
      try {
        await fs.access(pluginPath);
      } catch {
        return [];
      }

      // Read version directories
      const entries = await fs.readdir(pluginPath, { withFileTypes: true });
      const versions = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => /^\d+\.\d+\.\d+$/.test(name))
        .sort((a, b) => this.compareVersions(b, a)); // Sort descending

      return versions;
    } catch (error) {
      this.logger.error('Failed to get available versions', { error });
      throw error;
    }
  }

  /**
   * Delete a plugin bundle
   */
  async deleteBundle(pluginId: number, version: string): Promise<void> {
    try {
      const versionPath = path.join(this.config.storageRoot, pluginId.toString(), version);
      
      // Check if version directory exists
      try {
        await fs.access(versionPath);
      } catch {
        throw new Error(`Bundle not found for plugin ${pluginId} version ${version}`);
      }

      // Remove version directory
      await fs.rm(versionPath, { recursive: true, force: true });

      this.logger.info(`Deleted plugin bundle`, { pluginId, version });
    } catch (error) {
      this.logger.error('Failed to delete plugin bundle', { error });
      throw error;
    }
  }

  /**
   * Get bundle metadata
   */
  private async getBundleMetadata(
    pluginId: number,
    version: string
  ): Promise<BundleMetadata | null> {
    try {
      const versionPath = path.join(this.config.storageRoot, pluginId.toString(), version);
      
      // Find metadata file
      const files = await fs.readdir(versionPath);
      const metaFile = files.find(f => f.endsWith('.meta.json'));
      
      if (!metaFile) {
        return null;
      }

      const metadataPath = path.join(versionPath, metaFile);
      const content = await fs.readFile(metadataPath, 'utf8');
      return JSON.parse(content) as BundleMetadata;
    } catch {
      return null;
    }
  }

  /**
   * Create storage path for a plugin version
   */
  private async createStoragePath(pluginId: number, version: string): Promise<string> {
    const storagePath = path.join(
      this.config.storageRoot,
      pluginId.toString(),
      version
    );

    await fs.mkdir(storagePath, { recursive: true });
    return storagePath;
  }

  /**
   * Generate unique bundle ID
   */
  private generateBundleId(pluginId: number, version: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${pluginId}-${version.replace(/\./g, '-')}-${timestamp}-${random}`;
  }

  /**
   * Download file with progress tracking
   */
  private async downloadFile(
    url: string,
    expectedSize: number,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<Buffer> {
    // For local files
    if (url.startsWith('/') || url.startsWith('./')) {
      return fs.readFile(url);
    }

    // For remote files (CDN)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const contentLength = Number(response.headers.get('content-length')) || expectedSize;
    const chunks: Uint8Array[] = [];
    let downloadedBytes = 0;
    const startTime = Date.now();

    const reader = response.body!.getReader();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      downloadedBytes += value.length;

      if (onProgress) {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const speed = downloadedBytes / elapsedTime;
        const remainingBytes = contentLength - downloadedBytes;
        const remainingTime = remainingBytes / speed;

        onProgress({
          totalBytes: contentLength,
          downloadedBytes,
          percentage: (downloadedBytes / contentLength) * 100,
          speed,
          remainingTime
        });
      }
    }

    return Buffer.concat(chunks);
  }

  /**
   * Increment download count
   */
  private async incrementDownloadCount(metadata: BundleMetadata): Promise<void> {
    metadata.downloadCount++;
    const metadataPath = metadata.storageUrl.replace('.rbsm', '.meta.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Get public key for signature verification
   */
  private async getPublicKey(publisherId?: number): Promise<string> {
    // In production, this would fetch from a certificate authority
    // or publisher registry
    return process.env.PLUGIN_PUBLISHER_PUBLIC_KEY || '';
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (aParts[i] > bParts[i]) return 1;
      if (aParts[i] < bParts[i]) return -1;
    }

    return 0;
  }

  /**
   * Clean up old versions (keep latest N versions)
   */
  async cleanupOldVersions(pluginId: number, keepVersions: number = 3): Promise<void> {
    try {
      const versions = await this.getAvailableVersions(pluginId);
      
      if (versions.length <= keepVersions) {
        return;
      }

      const versionsToDelete = versions.slice(keepVersions);
      
      for (const version of versionsToDelete) {
        await this.deleteBundle(pluginId, version);
      }

      this.logger.info(`Cleaned up old plugin versions`, {
        pluginId,
        deletedVersions: versionsToDelete
      });
    } catch (error) {
      this.logger.error('Failed to cleanup old versions', { error });
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalPlugins: number;
    totalVersions: number;
    totalSize: number;
    plugins: Array<{
      pluginId: number;
      versions: number;
      size: number;
    }>;
  }> {
    try {
      const stats = {
        totalPlugins: 0,
        totalVersions: 0,
        totalSize: 0,
        plugins: [] as Array<{ pluginId: number; versions: number; size: number }>
      };

      const pluginDirs = await fs.readdir(this.config.storageRoot, { withFileTypes: true });
      
      for (const dir of pluginDirs) {
        if (!dir.isDirectory()) continue;
        
        const pluginId = Number(dir.name);
        if (isNaN(pluginId)) continue;

        const pluginPath = path.join(this.config.storageRoot, dir.name);
        const versions = await fs.readdir(pluginPath, { withFileTypes: true });
        
        let pluginSize = 0;
        let versionCount = 0;

        for (const versionDir of versions) {
          if (!versionDir.isDirectory()) continue;
          
          versionCount++;
          const versionPath = path.join(pluginPath, versionDir.name);
          const files = await fs.readdir(versionPath);
          
          for (const file of files) {
            if (file.endsWith('.rbsm')) {
              const filePath = path.join(versionPath, file);
              const stat = await fs.stat(filePath);
              pluginSize += stat.size;
            }
          }
        }

        stats.totalPlugins++;
        stats.totalVersions += versionCount;
        stats.totalSize += pluginSize;
        stats.plugins.push({
          pluginId,
          versions: versionCount,
          size: pluginSize
        });
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get storage stats', { error });
      throw error;
    }
  }
}