/**
 * Temporary stub for security monitoring
 * This prevents errors while debugging the middleware issue
 */

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'attack' | 'block' | 'violation' | 'suspicious' | 'scan';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  path?: string;
  method?: string;
  userAgent?: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface ThreatAnalysis {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreatCount: number;
  recentAttackPatterns: string[];
  recommendations: string[];
}

// Stub implementation
class SecurityMonitorStub {
  logEvent(event: any): void {
    // Do nothing for now
  }
  
  blockIP(ip: string, reason: string, durationMs?: number): void {
    // Do nothing for now
  }
  
  unblockIP(ip: string): void {
    // Do nothing for now
  }
  
  isIPBlocked(ip: string): boolean {
    return false;
  }
  
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return [];
  }
  
  getBlockedIPs(): any[] {
    return [];
  }
  
  getStats(): any {
    return {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivities: 0,
      attacksByType: new Map(),
      topThreats: [],
      eventCount: 0,
      attackPatterns: []
    };
  }
  
  getThreatAnalysis(): ThreatAnalysis {
    return {
      threatLevel: 'low',
      activeThreatCount: 0,
      recentAttackPatterns: [],
      recommendations: []
    };
  }
}

export const securityMonitor = new SecurityMonitorStub();
