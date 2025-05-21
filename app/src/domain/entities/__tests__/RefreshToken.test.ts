import { RefreshToken } from '../RefreshToken';

describe('RefreshToken', () => {
  let refreshToken: RefreshToken;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const defaultRefreshTokenValues = {
    token: 'abc123def456',
    userId: 123,
    expiresAt: tomorrow,
    createdByIp: '192.168.1.1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    // Reset time mocks and use a fresh token for each test
    jest.useRealTimers();
    refreshToken = new RefreshToken(defaultRefreshTokenValues);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyToken = new RefreshToken();
      
      expect(emptyToken.token).toBe('');
      expect(emptyToken.userId).toBe(0);
      expect(emptyToken.expiresAt).toBeInstanceOf(Date);
      expect(emptyToken.isRevoked).toBe(false);
      expect(emptyToken.id).toBe(0); // ID is always 0 for RefreshToken
    });
    
    it('should initialize with provided values', () => {
      expect(refreshToken.token).toBe('abc123def456');
      expect(refreshToken.userId).toBe(123);
      expect(refreshToken.expiresAt).toEqual(tomorrow);
      expect(refreshToken.createdByIp).toBe('192.168.1.1');
      expect(refreshToken.isRevoked).toBe(false);
      expect(refreshToken.id).toBe(0); // ID is always 0 for RefreshToken
    });
    
    it('should convert date strings to Date objects', () => {
      const token = new RefreshToken({
        expiresAt: tomorrow.toISOString(),
        revokedAt: yesterday.toISOString()
      });
      
      expect(token.expiresAt).toBeInstanceOf(Date);
      expect(token.revokedAt).toBeInstanceOf(Date);
    });
  });
  
  describe('isActive method', () => {
    it('should return true for non-revoked and non-expired tokens', () => {
      // Token expires tomorrow and is not revoked
      expect(refreshToken.isActive()).toBe(true);
    });
    
    it('should return false for revoked tokens', () => {
      refreshToken.isRevoked = true;
      expect(refreshToken.isActive()).toBe(false);
    });
    
    it('should return false for expired tokens', () => {
      refreshToken.expiresAt = yesterday;
      expect(refreshToken.isActive()).toBe(false);
    });
  });
  
  describe('isExpired method', () => {
    it('should return true for expired tokens', () => {
      refreshToken.expiresAt = yesterday;
      expect(refreshToken.isExpired()).toBe(true);
    });
    
    it('should return false for non-expired tokens', () => {
      refreshToken.expiresAt = tomorrow;
      expect(refreshToken.isExpired()).toBe(false);
    });
    
    it('should use current time for expiration check', () => {
      // Set token to expire in 5 seconds
      const inFiveSeconds = new Date();
      inFiveSeconds.setSeconds(inFiveSeconds.getSeconds() + 5);
      refreshToken.expiresAt = inFiveSeconds;
      
      // Should not be expired yet
      expect(refreshToken.isExpired()).toBe(false);
      
      // Mock time to be 10 seconds later
      jest.useFakeTimers();
      jest.setSystemTime(new Date(inFiveSeconds.getTime() + 10000));
      
      // Should now be expired
      expect(refreshToken.isExpired()).toBe(true);
    });
  });
  
  describe('revoke method', () => {
    it('should mark the token as revoked', () => {
      const ipAddress = '192.168.1.2';
      const newToken = 'newToken123';
      
      // Before revoking
      expect(refreshToken.isRevoked).toBe(false);
      expect(refreshToken.revokedAt).toBeUndefined();
      
      refreshToken.revoke(ipAddress, newToken);
      
      // After revoking
      expect(refreshToken.isRevoked).toBe(true);
      expect(refreshToken.revokedAt).toBeInstanceOf(Date);
      expect(refreshToken.revokedByIp).toBe(ipAddress);
      expect(refreshToken.replacedByToken).toBe(newToken);
    });
    
    it('should return the instance for chaining', () => {
      const result = refreshToken.revoke('192.168.1.2');
      expect(result).toBe(refreshToken);
    });
    
    it('should handle missing optional parameters', () => {
      refreshToken.revoke();
      
      expect(refreshToken.isRevoked).toBe(true);
      expect(refreshToken.revokedAt).toBeInstanceOf(Date);
      expect(refreshToken.revokedByIp).toBeUndefined();
      expect(refreshToken.replacedByToken).toBeUndefined();
    });
  });
  
  describe('toObject method', () => {
    it('should include only the Prisma schema fields', () => {
      const obj = refreshToken.toObject();
      
      // Should include refresh token specific fields
      expect(obj).toHaveProperty('token', refreshToken.token);
      expect(obj).toHaveProperty('userId', refreshToken.userId);
      expect(obj).toHaveProperty('expiresAt', refreshToken.expiresAt);
      expect(obj).toHaveProperty('createdAt', refreshToken.createdAt);
      expect(obj).toHaveProperty('createdByIp', refreshToken.createdByIp);
      expect(obj).toHaveProperty('isRevoked', refreshToken.isRevoked);
      
      // Should not include numeric id
      expect(obj).not.toHaveProperty('id');
      // Should not include updatedAt or other BaseEntity fields not in the Prisma schema
      expect(obj).not.toHaveProperty('updatedAt');
      expect(obj).not.toHaveProperty('updatedBy');
    });
  });
  
  describe('getPrimaryKey method', () => {
    it('should return the token string as the primary key', () => {
      expect(refreshToken.getPrimaryKey()).toBe('abc123def456');
    });
  });
});