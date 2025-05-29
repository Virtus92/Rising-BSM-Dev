import * as crypto from 'crypto';

export interface EncryptedPlugin {
  data: Buffer;
  iv: Buffer;
  checksum: string;
  algorithm: string;
  version: number;
}

export class PluginEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationSalt = 'rising-bsm-plugin-encryption-v1';
  private readonly checksumAlgorithm = 'sha256';
  private readonly version = 1;

  async encryptPlugin(
    pluginCode: Buffer,
    licenseKey: string
  ): Promise<EncryptedPlugin> {
    // Generate encryption key from license
    const encryptionKey = await this.deriveKey(licenseKey);
    
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);
    
    // Encrypt data
    const encrypted = Buffer.concat([
      cipher.update(pluginCode),
      cipher.final()
    ]);
    
    // Get auth tag for GCM
    const authTag = cipher.getAuthTag();
    
    // Combine encrypted data with auth tag
    const encryptedWithTag = Buffer.concat([encrypted, authTag]);
    
    // Calculate checksum
    const checksum = await this.calculateChecksum(encryptedWithTag);
    
    return {
      data: encryptedWithTag,
      iv,
      checksum,
      algorithm: this.algorithm,
      version: this.version
    };
  }

  async decryptPlugin(
    encrypted: EncryptedPlugin,
    licenseKey: string
  ): Promise<Buffer> {
    // Verify version compatibility
    if (encrypted.version !== this.version) {
      throw new Error(`Unsupported encryption version: ${encrypted.version}`);
    }
    
    // Verify integrity
    const checksum = await this.calculateChecksum(encrypted.data);
    if (checksum !== encrypted.checksum) {
      throw new Error('Plugin integrity check failed');
    }
    
    // Derive decryption key
    const encryptionKey = await this.deriveKey(licenseKey);
    
    // Extract auth tag (last 16 bytes for GCM)
    const authTag = encrypted.data.slice(-16);
    const encryptedData = encrypted.data.slice(0, -16);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      encrypted.algorithm,
      encryptionKey,
      encrypted.iv
    );
    
    // Set auth tag
    (decipher as any).setAuthTag(authTag);
    
    // Decrypt
    try {
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt plugin: Invalid license key or corrupted data');
    }
  }

  async deriveKey(licenseKey: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        licenseKey,
        this.keyDerivationSalt,
        100000, // iterations
        32, // key length
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  async calculateChecksum(data: Buffer): Promise<string> {
    const hash = crypto.createHash(this.checksumAlgorithm);
    hash.update(data);
    return hash.digest('hex');
  }

  generateLicenseKey(): string {
    // Generate a secure random license key
    const segments = [];
    for (let i = 0; i < 5; i++) {
      const segment = crypto.randomBytes(3).toString('hex').toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  }

  async signPlugin(pluginData: Buffer, privateKey: string): Promise<string> {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(pluginData);
    return sign.sign(privateKey, 'base64');
  }

  async verifyPluginSignature(
    pluginData: Buffer,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(pluginData);
      return verify.verify(publicKey, signature, 'base64');
    } catch {
      return false;
    }
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    return { publicKey, privateKey };
  }

  // Generate hardware fingerprint
  async generateHardwareId(components: {
    cpuId?: string;
    macAddress?: string;
    diskSerial?: string;
    hostname?: string;
  }): Promise<string> {
    const data = JSON.stringify(components);
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  // Watermark plugin code for forensic tracking
  watermarkPlugin(
    pluginCode: string,
    licenseKey: string,
    userId: number
  ): string {
    const watermark = `/* Licensed to: ${licenseKey} | User: ${userId} | ${new Date().toISOString()} */\n`;
    const encodedWatermark = Buffer.from(watermark).toString('base64');
    
    // Inject watermark in multiple places
    const watermarkedCode = pluginCode
      .replace(/\/\*\s*watermark:start\s*\*\//g, `/* watermark:start ${encodedWatermark} */`)
      .replace(/\/\*\s*watermark:end\s*\*\//g, `/* watermark:end ${encodedWatermark} */`);
    
    // Add hidden watermark in whitespace
    const hiddenWatermark = this.encodeInWhitespace(encodedWatermark);
    
    return watermarkedCode + hiddenWatermark;
  }

  private encodeInWhitespace(data: string): string {
    // Encode data in zero-width characters
    const zeroWidthSpace = '\u200B';
    const zeroWidthNonJoiner = '\u200C';
    const zeroWidthJoiner = '\u200D';
    
    let encoded = '\n/* */';
    for (const char of data) {
      const code = char.charCodeAt(0);
      if (code & 1) encoded += zeroWidthSpace;
      if (code & 2) encoded += zeroWidthNonJoiner;
      if (code & 4) encoded += zeroWidthJoiner;
    }
    return encoded;
  }
}