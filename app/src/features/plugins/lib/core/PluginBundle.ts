import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Plugin manifest structure
 */
export interface PluginManifest {
  // Basic metadata
  name: string;
  displayName: string;
  version: string;
  description?: string;
  author: string;
  homepage?: string;
  repository?: string;
  
  // Plugin configuration
  type: 'ui' | 'api' | 'automation' | 'mixed';
  main: string; // Entry point file
  
  // Compatibility
  minAppVersion: string;
  maxAppVersion?: string;
  
  // Dependencies
  dependencies?: Record<string, string>; // plugin-name: version
  
  // Permissions required
  permissions: Array<{
    code: string;
    description: string;
    required: boolean;
  }>;
  
  // Exports
  exports?: {
    components?: string[]; // UI component names
    routes?: string[]; // API route patterns
    hooks?: string[]; // Automation hook names
    services?: string[]; // Service names
  };
  
  // Build metadata
  buildTime: string;
  builderVersion: string;
  checksum?: string;
}

/**
 * Plugin bundle structure (.rbsm file)
 * Rising-BSM Plugin format - essentially a compressed JSON with binary data
 */
export interface PluginBundle {
  // Format version
  formatVersion: string;
  
  // Manifest
  manifest: PluginManifest;
  
  // Files in the bundle
  files: Record<string, PluginFile>;
  
  // Digital signature
  signature?: string;
  
  // Certificate from marketplace
  certificate?: string;
  
  // Encryption metadata (if encrypted)
  encryption?: {
    algorithm: string;
    iv: string;
    encryptedKey?: string;
  };
}

/**
 * Individual file in the plugin bundle
 */
export interface PluginFile {
  path: string;
  content: string; // Base64 encoded for binary files
  encoding: 'utf8' | 'base64';
  size: number;
  checksum: string;
  compressed?: boolean;
}

/**
 * Plugin bundle utilities
 */
export class PluginBundleUtils {
  static readonly FORMAT_VERSION = '1.0.0';
  static readonly BUNDLE_EXTENSION = '.rbsm';
  
  /**
   * Create a plugin bundle from files
   */
  static async createBundle(
    manifest: PluginManifest,
    files: Record<string, Buffer | string>
  ): Promise<PluginBundle> {
    const bundle: PluginBundle = {
      formatVersion: this.FORMAT_VERSION,
      manifest: {
        ...manifest,
        buildTime: new Date().toISOString(),
        builderVersion: '1.0.0'
      },
      files: {}
    };
    
    // Process each file
    for (const [path, content] of Object.entries(files)) {
      const buffer = typeof content === 'string' 
        ? Buffer.from(content, 'utf8')
        : content;
      
      // Compress if beneficial
      const compressed = await gzip(buffer);
      const useCompression = compressed.length < buffer.length * 0.9;
      
      const fileContent = useCompression ? compressed : buffer;
      const encoding = this.isBinaryFile(path) ? 'base64' : 'utf8';
      
      bundle.files[path] = {
        path,
        content: fileContent.toString(encoding),
        encoding,
        size: buffer.length,
        checksum: this.calculateChecksum(buffer),
        compressed: useCompression
      };
    }
    
    // Calculate bundle checksum
    bundle.manifest.checksum = this.calculateBundleChecksum(bundle);
    
    return bundle;
  }
  
  /**
   * Serialize bundle to buffer
   */
  static async serializeBundle(bundle: PluginBundle): Promise<Buffer> {
    const json = JSON.stringify(bundle, null, 2);
    const compressed = await gzip(Buffer.from(json, 'utf8'));
    
    // Add magic bytes for file identification
    const magic = Buffer.from('RBSM', 'utf8');
    const version = Buffer.from([1, 0, 0]); // Version 1.0.0
    
    return Buffer.concat([magic, version, compressed]);
  }
  
  /**
   * Deserialize bundle from buffer
   */
  static async deserializeBundle(buffer: Buffer): Promise<PluginBundle> {
    // Check magic bytes
    const magic = buffer.slice(0, 4).toString('utf8');
    if (magic !== 'RBSM') {
      throw new Error('Invalid plugin bundle format');
    }
    
    // Check version
    const version = Array.from(buffer.slice(4, 7));
    if (version[0] !== 1) {
      throw new Error(`Unsupported bundle version: ${version.join('.')}`);
    }
    
    // Decompress bundle
    const compressed = buffer.slice(7);
    const decompressed = await gunzip(compressed);
    const bundle = JSON.parse(decompressed.toString('utf8')) as PluginBundle;
    
    // Validate structure
    this.validateBundle(bundle);
    
    return bundle;
  }
  
  /**
   * Extract files from bundle
   */
  static async extractFiles(bundle: PluginBundle): Promise<Record<string, Buffer>> {
    const files: Record<string, Buffer> = {};
    
    for (const [path, file] of Object.entries(bundle.files)) {
      let content = Buffer.from(file.content, file.encoding as BufferEncoding);
      
      // Decompress if needed
      if (file.compressed) {
        content = await gunzip(content);
      }
      
      // Verify checksum
      const checksum = this.calculateChecksum(content);
      if (checksum !== file.checksum) {
        throw new Error(`Checksum mismatch for file: ${path}`);
      }
      
      files[path] = content;
    }
    
    return files;
  }
  
  /**
   * Validate bundle structure
   */
  static validateBundle(bundle: PluginBundle): void {
    if (!bundle.formatVersion || bundle.formatVersion !== this.FORMAT_VERSION) {
      throw new Error('Invalid or unsupported bundle format version');
    }
    
    if (!bundle.manifest) {
      throw new Error('Bundle missing manifest');
    }
    
    if (!bundle.files || Object.keys(bundle.files).length === 0) {
      throw new Error('Bundle contains no files');
    }
    
    // Validate manifest
    this.validateManifest(bundle.manifest);
    
    // Validate main entry point exists
    if (!bundle.files[bundle.manifest.main]) {
      throw new Error(`Main entry point not found: ${bundle.manifest.main}`);
    }
  }
  
  /**
   * Validate manifest structure
   */
  static validateManifest(manifest: PluginManifest): void {
    const required = ['name', 'displayName', 'version', 'author', 'type', 'main', 'minAppVersion'];
    
    for (const field of required) {
      if (!manifest[field as keyof PluginManifest]) {
        throw new Error(`Manifest missing required field: ${field}`);
      }
    }
    
    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error('Invalid version format. Must be semantic versioning (X.Y.Z)');
    }
    
    // Validate type
    const validTypes = ['ui', 'api', 'automation', 'mixed'];
    if (!validTypes.includes(manifest.type)) {
      throw new Error(`Invalid plugin type: ${manifest.type}`);
    }
    
    // Validate permissions
    if (!Array.isArray(manifest.permissions)) {
      throw new Error('Manifest permissions must be an array');
    }
  }
  
  /**
   * Calculate file checksum
   */
  private static calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
  
  /**
   * Calculate bundle checksum
   */
  private static calculateBundleChecksum(bundle: PluginBundle): string {
    const content = JSON.stringify({
      manifest: bundle.manifest,
      files: Object.keys(bundle.files).sort()
    });
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Check if file is binary based on extension
   */
  private static isBinaryFile(path: string): boolean {
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
      '.woff', '.woff2', '.ttf', '.eot',
      '.zip', '.tar', '.gz',
      '.pdf', '.doc', '.docx'
    ];
    
    return binaryExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }
  
  /**
   * Sign a bundle with private key
   */
  static async signBundle(bundle: PluginBundle, privateKey: string): Promise<string> {
    const content = JSON.stringify({
      formatVersion: bundle.formatVersion,
      manifest: bundle.manifest,
      files: Object.fromEntries(
        Object.entries(bundle.files).map(([path, file]) => [path, file.checksum])
      )
    });
    
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(content);
    return sign.sign(privateKey, 'base64');
  }
  
  /**
   * Verify bundle signature
   */
  static async verifyBundleSignature(
    bundle: PluginBundle,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    const content = JSON.stringify({
      formatVersion: bundle.formatVersion,
      manifest: bundle.manifest,
      files: Object.fromEntries(
        Object.entries(bundle.files).map(([path, file]) => [path, file.checksum])
      )
    });
    
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(content);
    return verify.verify(publicKey, signature, 'base64');
  }
}