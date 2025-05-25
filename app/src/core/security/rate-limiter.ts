/**
 * Temporary stub for rate limiting
 * This prevents errors while debugging the middleware issue
 */

export class SecurityRateLimiter {
  constructor(options: any) {}
  
  async check(ip: string, path?: string) {
    return {
      allowed: true,
      remaining: 60,
      resetTime: Date.now() + 60000,
      blocked: false
    };
  }
  
  block(ip: string, reason: string): void {}
  
  isBlocked(ip: string): boolean {
    return false;
  }
  
  getStats() {
    return {
      totalRecords: 0,
      blockedIPs: 0,
      topViolators: []
    };
  }
  
  destroy(): void {}
}

// Stub instances
export const apiRateLimiter = new SecurityRateLimiter({});
export const authRateLimiter = new SecurityRateLimiter({});
export const passwordResetRateLimiter = new SecurityRateLimiter({});
export const publicRateLimiter = new SecurityRateLimiter({});
