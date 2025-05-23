/**
 * Webhook validation utilities
 */

/**
 * Validates a webhook URL
 */
export function validateWebhookUrl(url: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!url?.trim()) {
    errors.push('Webhook URL is required');
    return { isValid: false, errors };
  }
  
  try {
    const parsedUrl = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      errors.push('Webhook URL must use HTTP or HTTPS protocol');
    }
    
    // Prefer HTTPS for security
    if (parsedUrl.protocol === 'http:' && parsedUrl.hostname !== 'localhost' && !parsedUrl.hostname.startsWith('192.168.') && !parsedUrl.hostname.startsWith('127.')) {
      errors.push('HTTPS is recommended for webhook URLs (HTTP is only allowed for localhost and local networks)');
    }
    
    // Check for valid hostname
    if (!parsedUrl.hostname) {
      errors.push('Webhook URL must have a valid hostname');
    }
    
    // Validate hostname format
    if (parsedUrl.hostname && !isValidHostname(parsedUrl.hostname)) {
      errors.push('Invalid hostname format');
    }
    
    // Check for potentially dangerous URLs
    if (isDangerousUrl(parsedUrl)) {
      errors.push('Webhook URL appears to target internal/private networks which is not allowed');
    }
    
  } catch (error) {
    errors.push('Invalid URL format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates webhook headers
 */
export function validateWebhookHeaders(headers: Record<string, string>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!headers || typeof headers !== 'object') {
    return { isValid: true, errors: [] }; // Headers are optional
  }
  
  // Check each header
  for (const [name, value] of Object.entries(headers)) {
    // Validate header name
    if (!isValidHeaderName(name)) {
      errors.push(`Invalid header name: "${name}"`);
    }
    
    // Validate header value
    if (typeof value !== 'string') {
      errors.push(`Header "${name}" must be a string`);
    }
    
    // Check for potentially dangerous headers
    if (isDangerousHeader(name, value)) {
      errors.push(`Header "${name}" contains potentially dangerous content`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates webhook configuration
 */
export function validateWebhookConfig(config: {
  name: string;
  webhookUrl: string;
  headers?: Record<string, string>;
  payloadTemplate?: Record<string, any>;
  retryCount?: number;
  retryDelaySeconds?: number;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate name
  if (!config.name?.trim()) {
    errors.push('Webhook name is required');
  } else if (config.name.length > 100) {
    errors.push('Webhook name must be 100 characters or less');
  }
  
  // Validate URL
  const urlValidation = validateWebhookUrl(config.webhookUrl);
  if (!urlValidation.isValid) {
    errors.push(...urlValidation.errors);
  }
  
  // Validate headers
  if (config.headers) {
    const headersValidation = validateWebhookHeaders(config.headers);
    if (!headersValidation.isValid) {
      errors.push(...headersValidation.errors);
    }
  }
  
  // Validate payload template
  if (config.payloadTemplate) {
    try {
      JSON.stringify(config.payloadTemplate);
    } catch (error) {
      errors.push('Payload template must be valid JSON');
    }
  }
  
  // Validate retry settings
  if (config.retryCount !== undefined) {
    if (!Number.isInteger(config.retryCount) || config.retryCount < 0 || config.retryCount > 10) {
      errors.push('Retry count must be an integer between 0 and 10');
    }
  }
  
  if (config.retryDelaySeconds !== undefined) {
    if (!Number.isInteger(config.retryDelaySeconds) || config.retryDelaySeconds < 1 || config.retryDelaySeconds > 3600) {
      errors.push('Retry delay must be an integer between 1 and 3600 seconds');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a hostname is valid
 */
function isValidHostname(hostname: string): boolean {
  // Basic hostname validation
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostnameRegex.test(hostname);
}

/**
 * Checks if a URL is potentially dangerous (internal networks, etc.)
 */
function isDangerousUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  
  // Block localhost variations
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }
  
  // Block private IP ranges
  const privateRanges = [
    /^10\./,           // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
    /^192\.168\./,     // 192.168.0.0/16
    /^169\.254\./,     // 169.254.0.0/16 (link-local)
  ];
  
  for (const range of privateRanges) {
    if (range.test(hostname)) {
      return true;
    }
  }
  
  // Block other internal/special addresses
  const blockedPatterns = [
    /^0\.0\.0\.0$/,
    /^255\.255\.255\.255$/,
    /^224\./,  // Multicast
    /^240\./,  // Reserved
  ];
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(hostname)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validates HTTP header name
 */
function isValidHeaderName(name: string): boolean {
  // HTTP header names should be ASCII tokens
  const headerNameRegex = /^[!#$%&'*+-.0-9A-Z^_`|~a-z]+$/;
  return headerNameRegex.test(name);
}

/**
 * Checks if a header is potentially dangerous
 */
function isDangerousHeader(name: string, value: string): boolean {
  const lowerName = name.toLowerCase();
  
  // Block potentially dangerous headers
  const dangerousHeaders = [
    'authorization',  // Could expose API keys
    'cookie',         // Could expose session data
    'x-api-key',      // Common API key header
    'x-auth-token',   // Common auth token header
  ];
  
  if (dangerousHeaders.includes(lowerName)) {
    return true;
  }
  
  // Check for suspicious values
  const suspiciousPatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
  ];
  
  // Only flag as dangerous if it looks like credentials
  if (lowerName.includes('auth') || lowerName.includes('key') || lowerName.includes('token')) {
    return suspiciousPatterns.some(pattern => pattern.test(value));
  }
  
  return false;
}

/**
 * Sanitizes webhook headers by removing dangerous ones
 */
export function sanitizeWebhookHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [name, value] of Object.entries(headers)) {
    if (!isDangerousHeader(name, value) && isValidHeaderName(name)) {
      sanitized[name] = value;
    }
  }
  
  return sanitized;
}

/**
 * Tests a webhook URL by making a simple HEAD request
 */
export async function testWebhookConnection(url: string, headers?: Record<string, string>): Promise<{
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const validation = validateWebhookUrl(url);
    if (!validation.isValid) {
      return {
        success: false,
        responseTime: 0,
        error: validation.errors.join(', ')
      };
    }
    
    // Sanitize headers
    const sanitizedHeaders = headers ? sanitizeWebhookHeaders(headers) : {};
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Rising-BSM-Automation/1.0',
        ...sanitizedHeaders
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(10000) // 10 seconds
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: response.ok,
      responseTime,
      statusCode: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Common webhook URL patterns and their validation
 */
export const WEBHOOK_PATTERNS = {
  slack: {
    pattern: /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]{9}\/[A-Z0-9]{9}\/[a-zA-Z0-9]{24}$/,
    description: 'Slack Incoming Webhook URL'
  },
  discord: {
    pattern: /^https:\/\/discord(app)?\.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_-]+$/,
    description: 'Discord Webhook URL'
  },
  teams: {
    pattern: /^https:\/\/[a-zA-Z0-9-]+\.webhook\.office\.com\/webhookb2\/[a-f0-9-]+@[a-f0-9-]+\/IncomingWebhook\/[a-f0-9]+\/[a-f0-9-]+$/,
    description: 'Microsoft Teams Incoming Webhook URL'
  },
  generic: {
    pattern: /^https?:\/\/.+/,
    description: 'Generic HTTP/HTTPS URL'
  }
};

/**
 * Identifies the webhook type based on URL pattern
 */
export function identifyWebhookType(url: string): string {
  for (const [type, config] of Object.entries(WEBHOOK_PATTERNS)) {
    if (config.pattern.test(url)) {
      return type;
    }
  }
  return 'unknown';
}
