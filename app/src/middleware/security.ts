import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/log';
import { securityMonitor } from '@/core/security/monitoring';

const logger = getLogger();

/**
 * Blocked paths that should never be accessible
 * These are common targets for vulnerability scanners
 */
const BLOCKED_PATHS = [
  // Environment files
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.staging',
  '.env.example',
  
  // Configuration files
  'config.json',
  'config.php',
  'config.yml',
  'config.yaml',
  'database.yml',
  'database.json',
  'settings.py',
  'settings.json',
  
  // Database dumps and backups
  'db.sql',
  'dump.sql',
  'backup.sql',
  'database.sql',
  'db_backup.sql',
  '*.sql',
  
  // Version control
  '.git',
  '.gitignore',
  '.gitconfig',
  
  // PHP files (we're not a PHP app)
  'phpinfo.php',
  'info.php',
  'debug.php',
  'test.php',
  'i.php',
  
  // WordPress paths (common scan targets)
  'wp-config.php',
  'wp-admin',
  'wp-login.php',
  
  // Server configuration
  '.htaccess',
  'web.config',
  'nginx.conf',
  
  // Package files
  'composer.json',
  'composer.lock',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  
  // Docker files
  'docker-compose.yml',
  'Dockerfile',
  
  // Other sensitive files
  'secrets.yml',
  'credentials.json',
  'private.key',
  '*.pem',
  '*.key',
  '*.pfx',
];

/**
 * Attack patterns to detect and block
 * These are regular expressions that match common attack vectors
 */
const ATTACK_PATTERNS = [
  // Hidden files and directories
  /\/\.(env|git|htaccess|htpasswd|svn|bzr)/i,
  
  // Backup files
  /\.(sql|bak|backup|dump|old|orig|original|save|swp|tmp|temp)$/i,
  
  // Configuration files
  /\/(config|configuration|settings|database|db)\.(php|json|yml|yaml|xml|ini|conf)$/i,
  
  // Debug and test files
  /\/(debug|test|testing|dev|development|staging|admin|administrator)\.(php|jsp|asp|aspx)$/i,
  
  // PHP admin tools
  /\/(phpmyadmin|pma|mysql|mysqladmin|phpMyAdmin|myadmin|dbadmin)/i,
  
  // Common CMS paths
  /\/(wp-admin|wp-content|wp-includes|administrator|admin|backend)/i,
  
  // Path traversal attempts
  /\.\.(\/|\\)/,
  
  // Script injection attempts
  /<script|<iframe|javascript:/i,
  
  // SQL injection patterns
  /(\s|%20)(union|select|insert|update|delete|drop|create)(\s|%20)/i,
  
  // Common vulnerability scanner paths
  /\/(cgi-bin|fcgi-bin|cgi|fcgi)/i,
  
  // Java/JSP paths
  /\.(jsp|jspx|do|action)$/i,
  
  // ASP.NET paths
  /\.(asp|aspx|ashx|asmx|axd)$/i,
  
  // Shell scripts
  /\.(sh|bash|zsh|csh|tcsh|ksh)$/i,
];

/**
 * User agents that are commonly used by vulnerability scanners
 */
const SUSPICIOUS_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /burp/i,
  /owasp/i,
  /vulnerability/i,
  /scanner/i,
  /security\s*tool/i,
  /web\s*scanner/i,
  /acunetix/i,
  /nessus/i,
  /qualys/i,
  /metasploit/i,
];

/**
 * Track suspicious IPs in memory
 * In production, this should be persisted to Redis or database
 */
const suspiciousIPs = new Map<string, {
  count: number;
  firstSeen: number;
  lastSeen: number;
  blockedUntil?: number;
}>();

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') || 'unknown';
}

/**
 * Check if an IP is currently blocked
 */
function isIPBlocked(ip: string): boolean {
  const record = suspiciousIPs.get(ip);
  if (!record || !record.blockedUntil) {
    return false;
  }
  
  const now = Date.now();
  if (record.blockedUntil > now) {
    return true;
  }
  
  // Unblock if time has passed
  record.blockedUntil = undefined;
  return false;
}

/**
 * Track suspicious activity from an IP
 */
function trackSuspiciousActivity(ip: string, severity: 'low' | 'medium' | 'high' = 'medium') {
  const now = Date.now();
  const record = suspiciousIPs.get(ip) || {
    count: 0,
    firstSeen: now,
    lastSeen: now
  };
  
  record.count++;
  record.lastSeen = now;
  
  // Auto-block based on severity and count
  if (severity === 'high' || record.count >= 10) {
    // Block for 24 hours for high severity or repeated offenses
    record.blockedUntil = now + (24 * 60 * 60 * 1000);
  } else if (severity === 'medium' && record.count >= 5) {
    // Block for 1 hour for medium severity
    record.blockedUntil = now + (60 * 60 * 1000);
  }
  
  suspiciousIPs.set(ip, record);
}

/**
 * Security middleware to protect against common attacks
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse | void> {
  const { pathname, search } = request.nextUrl;
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const method = request.method;
  
  // In development, be less aggressive
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Always allow localhost in development
  if (isDevelopment && (clientIP === '::1' || clientIP === '127.0.0.1' || clientIP === 'localhost')) {
    return undefined;
  }
  
  // Check if IP is blocked (both in memory and monitor)
  if (isIPBlocked(clientIP) || securityMonitor.isIPBlocked(clientIP)) {
    logger.warn('Blocked IP attempted access', { 
      ip: clientIP, 
      path: pathname,
      method 
    });
    
    securityMonitor.logEvent({
      type: 'block',
      severity: 'medium',
      ip: clientIP,
      path: pathname,
      method,
      userAgent,
      details: 'Blocked IP attempted access'
    });
    
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Check for suspicious user agents
  for (const pattern of SUSPICIOUS_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      logger.error('Suspicious user agent detected', {
        ip: clientIP,
        userAgent,
        path: pathname,
        method
      });
      
      trackSuspiciousActivity(clientIP, 'high');
      
      securityMonitor.logEvent({
        type: 'scan',
        severity: 'critical',
        ip: clientIP,
        path: pathname,
        method,
        userAgent,
        details: 'Vulnerability scanner detected',
        metadata: { scannerType: userAgent }
      });
      
      // Auto-block scanners
      securityMonitor.blockIP(clientIP, `Vulnerability scanner: ${userAgent}`);
      
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  
  // Check for blocked paths
  const fullPath = pathname + search;
  const lowerPath = fullPath.toLowerCase();
  
  for (const blockedPath of BLOCKED_PATHS) {
    if (lowerPath.includes(blockedPath.toLowerCase()) || 
        (blockedPath.includes('*') && new RegExp(blockedPath.replace('*', '.*')).test(lowerPath))) {
      logger.error('Attempted access to blocked path', {
        ip: clientIP,
        path: pathname,
        blockedPath,
        method,
        userAgent
      });
      
      trackSuspiciousActivity(clientIP, 'high');
      
      securityMonitor.logEvent({
        type: 'attack',
        severity: 'high',
        ip: clientIP,
        path: pathname,
        method,
        userAgent,
        details: `Attempted access to blocked path: ${blockedPath}`,
        metadata: { 
          blockedPath,
          fullPath: lowerPath,
          attackType: 'path-traversal'
        }
      });
      
      // Return 404 to not reveal that we're blocking
      return new NextResponse('Not Found', { status: 404 });
    }
  }
  
  // Check for attack patterns
  for (const pattern of ATTACK_PATTERNS) {
    if (pattern.test(fullPath) || pattern.test(decodeURIComponent(fullPath))) {
      logger.error('Attack pattern detected', {
        ip: clientIP,
        path: pathname,
        pattern: pattern.toString(),
        method,
        userAgent
      });
      
      trackSuspiciousActivity(clientIP, 'high');
      
      securityMonitor.logEvent({
        type: 'attack',
        severity: 'critical',
        ip: clientIP,
        path: pathname,
        method,
        userAgent,
        details: `Attack pattern detected: ${pattern.toString()}`,
        metadata: { 
          pattern: pattern.toString(),
          fullPath,
          attackType: 'pattern-match'
        }
      });
      
      // Return 404 to not reveal that we're blocking
      return new NextResponse('Not Found', { status: 404 });
    }
  }
  
  // Skip body checks for now to avoid stream consumption issues
  // TODO: Implement body checking with proper request cloning
  
  // Log suspicious patterns even if not blocked
  if (pathname.includes('..') || pathname.includes('//')) {
    logger.warn('Suspicious path pattern', {
      ip: clientIP,
      path: pathname,
      method,
      userAgent
    });
    
    trackSuspiciousActivity(clientIP, 'low');
  }
  
  // Continue with the request
  return undefined;
}

/**
 * Periodic cleanup of old suspicious IP records
 * This should be called periodically (e.g., every hour)
 */
export function cleanupSuspiciousIPs() {
  const now = Date.now();
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
  
  for (const [ip, record] of suspiciousIPs.entries()) {
    // Remove records older than one week with no recent activity
    if (record.lastSeen < oneWeekAgo && (!record.blockedUntil || record.blockedUntil < now)) {
      suspiciousIPs.delete(ip);
    }
  }
}

// Set up periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupSuspiciousIPs, 60 * 60 * 1000); // Every hour
}
