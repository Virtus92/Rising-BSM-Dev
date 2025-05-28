import { PluginEncryptionService } from '../security/PluginEncryptionService';

describe('PluginEncryptionService', () => {
  let service: PluginEncryptionService;

  beforeEach(() => {
    service = new PluginEncryptionService();
  });

  describe('encryptPlugin and decryptPlugin', () => {
    it('should encrypt and decrypt plugin code successfully', async () => {
      const originalCode = Buffer.from('console.log("Hello, plugin!");');
      const licenseKey = 'ABC123-DEF456-GHI789-JKL012-MNO345';

      const encrypted = await service.encryptPlugin(originalCode, licenseKey);

      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.checksum).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.version).toBe(1);

      const decrypted = await service.decryptPlugin(encrypted, licenseKey);
      expect(decrypted.toString()).toBe(originalCode.toString());
    });

    it('should fail to decrypt with wrong license key', async () => {
      const originalCode = Buffer.from('console.log("Hello, plugin!");');
      const licenseKey = 'ABC123-DEF456-GHI789-JKL012-MNO345';
      const wrongKey = 'WRONG1-WRONG2-WRONG3-WRONG4-WRONG5';

      const encrypted = await service.encryptPlugin(originalCode, licenseKey);

      await expect(service.decryptPlugin(encrypted, wrongKey))
        .rejects.toThrow('Failed to decrypt plugin');
    });

    it('should fail integrity check with tampered data', async () => {
      const originalCode = Buffer.from('console.log("Hello, plugin!");');
      const licenseKey = 'ABC123-DEF456-GHI789-JKL012-MNO345';

      const encrypted = await service.encryptPlugin(originalCode, licenseKey);
      
      // Tamper with data
      encrypted.data[0] = encrypted.data[0] ^ 0xFF;

      await expect(service.decryptPlugin(encrypted, licenseKey))
        .rejects.toThrow('Plugin integrity check failed');
    });
  });

  describe('generateLicenseKey', () => {
    it('should generate valid license keys', () => {
      const key1 = service.generateLicenseKey();
      const key2 = service.generateLicenseKey();

      expect(key1).toMatch(/^[A-F0-9]{6}(-[A-F0-9]{6}){4}$/);
      expect(key2).toMatch(/^[A-F0-9]{6}(-[A-F0-9]{6}){4}$/);
      expect(key1).not.toBe(key2);
    });
  });

  describe('signPlugin and verifyPluginSignature', () => {
    it('should sign and verify plugin correctly', async () => {
      const pluginData = Buffer.from('plugin code here');
      const { publicKey, privateKey } = service.generateKeyPair();

      const signature = await service.signPlugin(pluginData, privateKey);
      const isValid = await service.verifyPluginSignature(pluginData, signature, publicKey);

      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong signature', async () => {
      const pluginData = Buffer.from('plugin code here');
      const { publicKey, privateKey } = service.generateKeyPair();
      const { privateKey: wrongKey } = service.generateKeyPair();

      const signature = await service.signPlugin(pluginData, wrongKey);
      const isValid = await service.verifyPluginSignature(pluginData, signature, publicKey);

      expect(isValid).toBe(false);
    });

    it('should fail verification with tampered data', async () => {
      const pluginData = Buffer.from('plugin code here');
      const tamperedData = Buffer.from('tampered plugin code');
      const { publicKey, privateKey } = service.generateKeyPair();

      const signature = await service.signPlugin(pluginData, privateKey);
      const isValid = await service.verifyPluginSignature(tamperedData, signature, publicKey);

      expect(isValid).toBe(false);
    });
  });

  describe('generateKeyPair', () => {
    it('should generate valid RSA key pair', () => {
      const { publicKey, privateKey } = service.generateKeyPair();

      expect(publicKey).toContain('BEGIN PUBLIC KEY');
      expect(publicKey).toContain('END PUBLIC KEY');
      expect(privateKey).toContain('BEGIN PRIVATE KEY');
      expect(privateKey).toContain('END PRIVATE KEY');
    });
  });

  describe('generateHardwareId', () => {
    it('should generate consistent hardware ID for same components', async () => {
      const components = {
        cpuId: 'Intel-i7-12345',
        macAddress: '00:11:22:33:44:55',
        diskSerial: 'WD-123456789',
        hostname: 'user-computer'
      };

      const id1 = await service.generateHardwareId(components);
      const id2 = await service.generateHardwareId(components);

      expect(id1).toBe(id2);
      expect(id1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different IDs for different components', async () => {
      const components1 = {
        cpuId: 'Intel-i7-12345',
        macAddress: '00:11:22:33:44:55'
      };

      const components2 = {
        cpuId: 'AMD-Ryzen-67890',
        macAddress: 'AA:BB:CC:DD:EE:FF'
      };

      const id1 = await service.generateHardwareId(components1);
      const id2 = await service.generateHardwareId(components2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('watermarkPlugin', () => {
    it('should add watermark to plugin code', () => {
      const originalCode = `
        /* watermark:start */
        function myPlugin() {
          console.log('Plugin running');
        }
        /* watermark:end */
      `;
      const licenseKey = 'ABC123-DEF456-GHI789-JKL012-MNO345';
      const userId = 12345;

      const watermarked = service.watermarkPlugin(originalCode, licenseKey, userId);

      expect(watermarked).toContain('/* watermark:start');
      expect(watermarked).toContain('/* watermark:end');
      expect(watermarked.length).toBeGreaterThan(originalCode.length);
    });
  });

  describe('calculateChecksum', () => {
    it('should calculate consistent checksum', async () => {
      const data = Buffer.from('test data');
      
      const checksum1 = await service.calculateChecksum(data);
      const checksum2 = await service.calculateChecksum(data);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should calculate different checksums for different data', async () => {
      const data1 = Buffer.from('test data 1');
      const data2 = Buffer.from('test data 2');
      
      const checksum1 = await service.calculateChecksum(data1);
      const checksum2 = await service.calculateChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('deriveKey', () => {
    it('should derive consistent key from license', async () => {
      const licenseKey = 'ABC123-DEF456-GHI789-JKL012-MNO345';
      
      const key1 = await service.deriveKey(licenseKey);
      const key2 = await service.deriveKey(licenseKey);

      expect(key1.toString('hex')).toBe(key2.toString('hex'));
      expect(key1.length).toBe(32); // 256 bits
    });

    it('should derive different keys for different licenses', async () => {
      const license1 = 'ABC123-DEF456-GHI789-JKL012-MNO345';
      const license2 = 'XYZ789-UVW456-RST123-OPQ789-LMN456';
      
      const key1 = await service.deriveKey(license1);
      const key2 = await service.deriveKey(license2);

      expect(key1.toString('hex')).not.toBe(key2.toString('hex'));
    });
  });
});