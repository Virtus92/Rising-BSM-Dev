import { createHash, randomBytes } from 'crypto';

/**
 * API Key Generator and Security Utilities
 * 
 * Provides secure API key generation, hashing, and validation functions.
 */
export class ApiKeyGenerator {
  /**
   * Length of the random part of the API key (in bytes)
   */
  private static readonly KEY_LENGTH = 32;
  
  /**
   * Prefix for production API keys
   */
  private static readonly PREFIX_LIVE = 'rk_live_';
  
  /**
   * Prefix for development API keys
   */
  private static readonly PREFIX_TEST = 'rk_test_';
  
  /**
   * Generate a new API key with all necessary components
   * 
   * @param environment - Environment for the key ('production' or 'development')
   * @returns Object containing all API key components
   */
  static generateApiKey(environment: 'production' | 'development' = 'production'): {
    plainTextKey: string;
    keyHash: string;
    keyPrefix: string;
    keyPreview: string;
  } {
    // Generate cryptographically secure random bytes
    const randomKey = randomBytes(this.KEY_LENGTH).toString('hex');
    
    // Create prefix based on environment
    const prefix = environment === 'production' ? this.PREFIX_LIVE : this.PREFIX_TEST;
    
    // Construct full key with prefix
    const plainTextKey = `${prefix}${randomKey}`;
    
    // Hash for secure storage (never store plain text)
    const keyHash = this.hashApiKey(plainTextKey);
    
    // Create preview for display purposes (first 12 chars + ... + last 4 chars)
    const keyPreview = `${plainTextKey.substring(0, 12)}...${plainTextKey.slice(-4)}`;
    
    return {
      plainTextKey,
      keyHash,
      keyPrefix: prefix,
      keyPreview
    };
  }

  /**
   * Hash an API key for secure storage
   * 
   * @param plainTextKey - Plain text API key to hash
   * @returns SHA-256 hash of the API key
   */
  static hashApiKey(plainTextKey: string): string {
    if (!plainTextKey) {
      throw new Error('API key cannot be empty');
    }
    
    return createHash('sha256').update(plainTextKey).digest('hex');
  }

  /**
   * Extract prefix from an API key
   * 
   * @param apiKey - API key to extract prefix from
   * @returns Prefix if valid, null otherwise
   */
  static extractPrefix(apiKey: string): string | null {
    if (!apiKey) return null;
    
    if (apiKey.startsWith(this.PREFIX_LIVE)) return this.PREFIX_LIVE;
    if (apiKey.startsWith(this.PREFIX_TEST)) return this.PREFIX_TEST;
    
    return null;
  }

  /**
   * Validate API key format
   * 
   * @param apiKey - API key to validate
   * @returns True if the format is valid
   */
  static isValidFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Check if it has a valid prefix
    const prefix = this.extractPrefix(apiKey);
    if (!prefix) return false;
    
    // Extract the key part (everything after the prefix)
    const keyPart = apiKey.substring(prefix.length);
    
    // Validate key part length (should be hex encoded, so 2 chars per byte)
    const expectedLength = this.KEY_LENGTH * 2;
    if (keyPart.length !== expectedLength) return false;
    
    // Validate that key part is valid hexadecimal
    const hexRegex = /^[a-f0-9]+$/i;
    return hexRegex.test(keyPart);
  }

  /**
   * Determine environment from API key
   * 
   * @param apiKey - API key to check
   * @returns Environment ('production', 'development', or null if invalid)
   */
  static getEnvironment(apiKey: string): 'production' | 'development' | null {
    const prefix = this.extractPrefix(apiKey);
    
    if (prefix === this.PREFIX_LIVE) return 'production';
    if (prefix === this.PREFIX_TEST) return 'development';
    
    return null;
  }

  /**
   * Create a preview of an API key for display
   * 
   * @param apiKey - Full API key
   * @returns Preview string showing only first and last few characters
   */
  static createPreview(apiKey: string): string {
    if (!apiKey || apiKey.length < 16) {
      return 'Invalid key';
    }
    
    return `${apiKey.substring(0, 12)}...${apiKey.slice(-4)}`;
  }

  /**
   * Generate a secure random token for other purposes
   * 
   * @param length - Length in bytes (default: 32)
   * @returns Hexadecimal token string
   */
  static generateSecureToken(length: number = 32): string {
    if (length <= 0) {
      throw new Error('Token length must be greater than 0');
    }
    
    return randomBytes(length).toString('hex');
  }

  /**
   * Validate API key strength and security
   * 
   * @param apiKey - API key to validate
   * @returns Validation result with security assessment
   */
  static validateKeySecurity(apiKey: string): {
    isValid: boolean;
    isSecure: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    let isValid = true;
    let isSecure = true;

    // Basic format validation
    if (!this.isValidFormat(apiKey)) {
      errors.push('Invalid API key format');
      isValid = false;
      isSecure = false;
    }

    if (isValid) {
      // Check for common security issues
      
      // Check for repeated characters (potential weakness)
      const keyPart = apiKey.substring(this.extractPrefix(apiKey)?.length || 0);
      const repeatedChar = /(.)\1{3,}/.test(keyPart);
      if (repeatedChar) {
        warnings.push('API key contains repeated characters');
        isSecure = false;
      }

      // Check for sequential patterns
      const hasSequential = this.hasSequentialPattern(keyPart);
      if (hasSequential) {
        warnings.push('API key contains sequential patterns');
        isSecure = false;
      }

      // Check entropy (simplified check)
      const entropy = this.calculateEntropy(keyPart);
      if (entropy < 3.5) {
        warnings.push('API key has low entropy');
        isSecure = false;
      }
    }

    return {
      isValid,
      isSecure,
      warnings,
      errors
    };
  }

  /**
   * Check for sequential patterns in a string
   * 
   * @param str - String to check
   * @returns True if sequential patterns are found
   */
  private static hasSequentialPattern(str: string): boolean {
    for (let i = 0; i < str.length - 3; i++) {
      const char1 = str.charCodeAt(i);
      const char2 = str.charCodeAt(i + 1);
      const char3 = str.charCodeAt(i + 2);
      const char4 = str.charCodeAt(i + 3);
      
      // Check for ascending sequence
      if (char2 === char1 + 1 && char3 === char2 + 1 && char4 === char3 + 1) {
        return true;
      }
      
      // Check for descending sequence
      if (char2 === char1 - 1 && char3 === char2 - 1 && char4 === char3 - 1) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate Shannon entropy of a string
   * 
   * @param str - String to analyze
   * @returns Entropy value
   */
  private static calculateEntropy(str: string): number {
    const len = str.length;
    const frequencies: { [key: string]: number } = {};
    
    // Count character frequencies
    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }
    
    // Calculate entropy
    let entropy = 0;
    for (const freq of Object.values(frequencies)) {
      const probability = freq / len;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }

  /**
   * Mask an API key for logging purposes
   * 
   * @param apiKey - API key to mask
   * @returns Masked version safe for logging
   */
  static maskForLogging(apiKey: string): string {
    if (!apiKey) return 'null';
    
    const prefix = this.extractPrefix(apiKey);
    if (!prefix) return '***invalid***';
    
    return `${prefix}${'*'.repeat(8)}...${apiKey.slice(-4)}`;
  }

  /**
   * Generate multiple API keys at once
   * 
   * @param count - Number of keys to generate
   * @param environment - Environment for the keys
   * @returns Array of generated API key objects
   */
  static generateMultipleKeys(count: number, environment: 'production' | 'development' = 'production'): Array<{
    plainTextKey: string;
    keyHash: string;
    keyPrefix: string;
    keyPreview: string;
  }> {
    if (count <= 0 || count > 100) {
      throw new Error('Count must be between 1 and 100');
    }
    
    const keys = [];
    for (let i = 0; i < count; i++) {
      keys.push(this.generateApiKey(environment));
    }
    
    return keys;
  }

  /**
   * Verify that a plain text key matches a hash
   * 
   * @param plainTextKey - Plain text API key
   * @param hash - Hash to compare against
   * @returns True if the key matches the hash
   */
  static verifyKeyHash(plainTextKey: string, hash: string): boolean {
    if (!plainTextKey || !hash) return false;
    
    try {
      const computedHash = this.hashApiKey(plainTextKey);
      return computedHash === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the expected key length for validation
   * 
   * @returns Expected total length of a properly formatted API key
   */
  static getExpectedKeyLength(): number {
    return this.PREFIX_LIVE.length + (this.KEY_LENGTH * 2);
  }

  /**
   * Get all valid prefixes
   * 
   * @returns Array of valid API key prefixes
   */
  static getValidPrefixes(): string[] {
    return [this.PREFIX_LIVE, this.PREFIX_TEST];
  }
}

/**
 * API Key Security Best Practices
 */
export const ApiKeySecurityGuidelines = {
  /**
   * Recommendations for API key usage
   */
  recommendations: [
    'Store API keys securely and never commit them to version control',
    'Use environment variables or secure key management systems',
    'Rotate API keys regularly (recommended: every 90 days)',
    'Set appropriate expiration dates for temporary access',
    'Use the principle of least privilege - grant only necessary permissions',
    'Monitor API key usage and set up alerts for unusual activity',
    'Revoke unused or compromised keys immediately',
    'Use different keys for different environments (production/development)',
    'Implement rate limiting and usage monitoring',
    'Keep access logs for security auditing'
  ],

  /**
   * Security checklist for API key implementation
   */
  securityChecklist: [
    'API keys are hashed before storage',
    'Plain text keys are never logged',
    'API key validation includes format and security checks',
    'Usage tracking is implemented',
    'Expiration dates are enforced',
    'Revocation is immediate and effective',
    'Permissions are properly validated',
    'Rate limiting is in place',
    'Audit logging is enabled',
    'Regular security reviews are scheduled'
  ]
};
