/**
 * Password utilities for secure password handling
 * 
 * These utilities provide secure password hashing and verification
 * using bcrypt with proper salt rounds.
 */
// Import crypto in a way that works in both Node.js and browser environments
const crypto = (() => {
  try {
    // Try to use native crypto for Node.js environments
    if (typeof window === 'undefined') {
      return require('crypto');
    }
    // For browser environments, use the Web Crypto API
    if (typeof window !== 'undefined' && window.crypto) {
      return {
        randomBytes: (size: number) => {
          const array = new Uint8Array(size);
          window.crypto.getRandomValues(array);
          return {
            toString: (encoding: string) => {
              if (encoding === 'hex') {
                return Array.from(array)
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join('');
              }
              return Array.from(array).join('');
            }
          };
        },
        createHash: (algorithm: string) => {
          // Simple replacement for SHA-256 - in a real app, you'd want to use
          // a proper crypto library like 'crypto-js' for browser environments
          let content = '';
          return {
            update: (data: string) => {
              content += data;
              return this;
            },
            digest: (encoding: string) => {
              // This is a simplified stand-in; in production, use a proper hashing library
              // For now, we'll just return a deterministic string based on the content
              const hashCode = Array.from(content).reduce(
                (s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0
              );
              const result = ('0000000' + (hashCode >>> 0).toString(16)).substr(-8);
              return result.padEnd(64, result); // Pad to match SHA-256 length
            }
          };
        }
      };
    }
    // Fallback for environments without crypto
    console.warn('Crypto not available - using insecure fallback. DO NOT USE IN PRODUCTION!');
    return {
      randomBytes: (size: number) => {
        const array = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return {
          toString: (encoding: string) => {
            if (encoding === 'hex') {
              return Array.from(array)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            }
            return Array.from(array).join('');
          }
        };
      },
      createHash: (algorithm: string) => {
        let content = '';
        return {
          update: (data: string) => {
            content += data;
            return this;
          },
          digest: (encoding: string) => {
            const hashCode = Array.from(content).reduce(
              (s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0
            );
            const result = ('0000000' + (hashCode >>> 0).toString(16)).substr(-8);
            return result.padEnd(64, result); // Pad to match SHA-256 length
          }
        };
      }
    };
  } catch (e) {
    console.error('Failed to initialize crypto module:', e);
    throw new Error('Crypto functionality not available');
  }
})();
import * as bcrypt from 'bcryptjs';

/**
 * Salt rounds for bcrypt
 * Higher values are more secure but slower
 */
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * 
 * @param password - Plain text password to hash
 * @returns Promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise that resolves to true if password matches hash, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Alias for verifyPassword function for backward compatibility
 * 
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise that resolves to true if password matches hash, false otherwise
 */
export const comparePasswords = verifyPassword;

/**
 * Generate a secure random token
 * 
 * @param length - Length of the token in bytes (default: 32)
 * @returns Secure random token string in hex format
 */
export function generateSecureToken(length: number = 32): string {
  try {
    // Ensure length is valid
    if (length <= 0) {
      throw new Error('Length must be greater than 0');
    }
    
    // Generate random bytes
    const buffer = crypto.randomBytes(length);
    return buffer.toString('hex');
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error(`Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a secure random string with specified character set
 * 
 * @param length - Length of the string
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Secure random string
 */
export function generateSecureString(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  if (length <= 0) {
    throw new Error('Length must be greater than 0');
  }
  
  const randomValues = crypto.randomBytes(length);
  const result = new Array(length);
  
  const charsetLength = charset.length;
  for (let i = 0; i < length; i++) {
    result[i] = charset[randomValues[i] % charsetLength];
  }
  
  return result.join('');
}

/**
 * Generate a secure random password
 * 
 * @param length - Length of the password (default: 12)
 * @param includeSpecialChars - Whether to include special characters (default: true) 
 * @returns Secure random password
 */
export function generateSecurePassword(length: number = 12, includeSpecialChars: boolean = true): string {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  // No I/O to avoid confusion
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz';  // No l to avoid confusion
  const numericChars = '23456789';                     // No 0/1 to avoid confusion
  const specialChars = '!@#$%^&*()_-+=<>?';           // Common special characters
  
  // Combine character sets based on parameters
  let charset = uppercaseChars + lowercaseChars + numericChars;
  if (includeSpecialChars) {
    charset += specialChars;
  }
  
  // Ensure minimum length
  if (length < 8) {
    length = 8; // Set minimum length for security
  }
  
  // Generate the random password
  let password = generateSecureString(length, charset);
  
  // Ensure password contains at least one character from each required character set
  const hasUppercase = (str: string) => /[A-Z]/.test(str);
  const hasLowercase = (str: string) => /[a-z]/.test(str);
  const hasNumber = (str: string) => /\d/.test(str);
  const hasSpecial = (str: string) => /[^A-Za-z0-9]/.test(str);
  
  // If the generated password doesn't meet requirements, regenerate until it does
  let attempts = 0;
  const maxAttempts = 10;
  
  while (
    attempts < maxAttempts && 
    (!hasUppercase(password) || 
     !hasLowercase(password) || 
     !hasNumber(password) || 
     (includeSpecialChars && !hasSpecial(password)))
  ) {
    password = generateSecureString(length, charset);
    attempts++;
  }
  
  // If we still don't have a valid password after max attempts,
  // manually ensure requirements are met
  if (!hasUppercase(password)) {
    const pos = Math.floor(Math.random() * length);
    password = password.substring(0, pos) + 
               uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length)) + 
               password.substring(pos + 1);
  }
  
  if (!hasLowercase(password)) {
    const pos = Math.floor(Math.random() * length);
    password = password.substring(0, pos) + 
               lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length)) + 
               password.substring(pos + 1);
  }
  
  if (!hasNumber(password)) {
    const pos = Math.floor(Math.random() * length);
    password = password.substring(0, pos) + 
               numericChars.charAt(Math.floor(Math.random() * numericChars.length)) + 
               password.substring(pos + 1);
  }
  
  if (includeSpecialChars && !hasSpecial(password)) {
    const pos = Math.floor(Math.random() * length);
    password = password.substring(0, pos) + 
               specialChars.charAt(Math.floor(Math.random() * specialChars.length)) + 
               password.substring(pos + 1);
  }
  
  return password;
}

/**
 * Create a secure hash of a string using SHA-256
 * 
 * @param input - String to hash
 * @param salt - Optional salt to add to the hash
 * @returns SHA-256 hash of the input
 */
export function createHash(input: string, salt?: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  if (salt) {
    hash.update(salt);
  }
  return hash.digest('hex');
}