import { createSafeTestHeaders, debugHeaders } from './webhook-headers.enhanced';

/**
 * Enhanced Webhook validation utilities with improved testing
 * 
 * Fixes the 404 webhook testing issue by using appropriate HTTP methods
 * and handling different webhook service requirements
 */

/**
 * Webhook service patterns and their specific requirements
 */
export const WEBHOOK_SERVICE_CONFIGS = {
  n8n: {
    patterns: [
      /^https:\/\/.*\.app\.n8n\.cloud\/webhook/,
      /^https:\/\/.*\.n8n\.cloud\/webhook/,
      /^https:\/\/n8n\./
    ],
    supportedMethods: ['POST'],
    requiresPayload: true,
    description: 'n8n Cloud Webhook'
  },
  slack: {
    patterns: [
      /^https:\/\/hooks\.slack\.com\/services\//
    ],
    supportedMethods: ['POST'],
    requiresPayload: true,
    description: 'Slack Incoming Webhook'
  },
  discord: {
    patterns: [
      /^https:\/\/discord(?:app)?\.com\/api\/webhooks\//
    ],
    supportedMethods: ['POST'],
    requiresPayload: true,
    description: 'Discord Webhook'
  },
  teams: {
    patterns: [
      /^https:\/\/.*\.webhook\.office\.com\/webhookb2\//
    ],
    supportedMethods: ['POST'],
    requiresPayload: true,
    description: 'Microsoft Teams Webhook'
  },
  zapier: {
    patterns: [
      /^https:\/\/hooks\.zapier\.com\//
    ],
    supportedMethods: ['POST'],
    requiresPayload: true,
    description: 'Zapier Webhook'
  },
  generic: {
    patterns: [/^https?:\/\/.+/],
    supportedMethods: ['HEAD', 'GET', 'POST'],
    requiresPayload: false,
    description: 'Generic HTTP Endpoint'
  }
};

/**
 * Identifies webhook service configuration
 */
export function identifyWebhookService(url: string): {
  type: string;
  config: typeof WEBHOOK_SERVICE_CONFIGS[keyof typeof WEBHOOK_SERVICE_CONFIGS];
} {
  for (const [serviceType, config] of Object.entries(WEBHOOK_SERVICE_CONFIGS)) {
    if (serviceType === 'generic') continue; // Check generic last
    
    for (const pattern of config.patterns) {
      if (pattern.test(url)) {
        return { type: serviceType, config };
      }
    }
  }
  
  return { type: 'generic', config: WEBHOOK_SERVICE_CONFIGS.generic };
}

/**
 * Enhanced webhook testing with service-specific handling
 */
export async function testWebhookConnectionEnhanced(
  url: string, 
  headers?: Record<string, string>,
  customPayload?: Record<string, any>
): Promise<{
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  serviceType: string;
  methodUsed: string;
  responseBody?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Validate URL first
    const validation = validateWebhookUrl(url);
    if (!validation.isValid) {
      return {
        success: false,
        responseTime: 0,
        error: validation.errors.join(', '),
        serviceType: 'unknown',
        methodUsed: 'none'
      };
    }
    
    // Identify webhook service
    const { type: serviceType, config } = identifyWebhookService(url);
    

    
    // Create safe headers for testing
    const safeHeaders = createSafeTestHeaders(headers || {}, url);
    
    // Debug header sanitization
    if (headers && Object.keys(headers).length > 0) {
      debugHeaders(headers, safeHeaders);
    }
    
    // Try methods in order of preference
    const methodsToTry = [...config.supportedMethods];
    let lastError: string | undefined;
    let lastStatusCode: number | undefined;
    let lastResponseBody: string | undefined;
    
    for (const method of methodsToTry) {
      try {
        const testResult = await performWebhookTest(
          url, 
          method, 
          safeHeaders, 
          config.requiresPayload ? (customPayload || generateTestPayload(serviceType)) : undefined,
          serviceType
        );
        
        const responseTime = Date.now() - startTime;
        
        if (testResult.success) {
          return {
            success: true,
            responseTime,
            statusCode: testResult.statusCode,
            serviceType,
            methodUsed: method,
            responseBody: testResult.responseBody
          };
        } else {
          lastError = testResult.error;
          lastStatusCode = testResult.statusCode;
          lastResponseBody = testResult.responseBody;
          
          // If we get a 405 Method Not Allowed, try next method
          if (testResult.statusCode === 405) {
            continue;
          }
          
          // For other errors, if this isn't the last method, continue
          if (methodsToTry.indexOf(method) < methodsToTry.length - 1) {
            continue;
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // Try next method if available
        if (methodsToTry.indexOf(method) < methodsToTry.length - 1) {
          continue;
        }
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      responseTime,
      statusCode: lastStatusCode,
      error: lastError || 'All test methods failed',
      serviceType,
      methodUsed: methodsToTry[methodsToTry.length - 1],
      responseBody: lastResponseBody
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      serviceType: 'unknown',
      methodUsed: 'none'
    };
  }
}

/**
 * Performs the actual webhook test with specified method
 */
async function performWebhookTest(
  url: string,
  method: string,
  headers: Record<string, string>,
  payload?: Record<string, any>,
  serviceType?: string
): Promise<{
  success: boolean;
  statusCode?: number;
  error?: string;
  responseBody?: string;
}> {
  console.log(`[Webhook Test] Testing ${serviceType} webhook:`, {
    url,
    method,
    hasPayload: !!payload,
    headerCount: Object.keys(headers).length
  });
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      ...headers
    },
    signal: AbortSignal.timeout(15000) // 15 seconds timeout
  };
  
  // Add payload for POST requests
  if (method === 'POST' && payload) {
    requestOptions.headers = {
      ...requestOptions.headers,
      'Content-Type': 'application/json'
    };
    requestOptions.body = JSON.stringify(payload);
    console.log(`[Webhook Test] Payload:`, JSON.stringify(payload, null, 2));
  }
  
  try {
    const response = await fetch(url, requestOptions);
    
    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch (error) {
      console.log('[Webhook Test] Could not read response body');
    }
    
    console.log(`[Webhook Test] Response:`, {
      status: response.status,
      statusText: response.statusText,
      bodyLength: responseBody.length,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    return {
      success: response.ok,
      statusCode: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      responseBody
    };
  } catch (error) {
    console.error('[Webhook Test] Request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseBody: ''
    };
  }
}

/**
 * Generates appropriate test payload for different webhook services
 */
function generateTestPayload(serviceType: string): Record<string, any> {
  const timestamp = new Date().toISOString();
  const testId = Math.random().toString(36).substr(2, 9);
  
  const basePayload = {
    test: true,
    source: 'Rising-BSM-Automation',
    timestamp,
    testId
  };
  
  switch (serviceType) {
    case 'n8n':
      return {
        ...basePayload,
        type: 'webhook_test',
        message: 'Test webhook from Rising-BSM automation system',
        data: {
          webhook_test: true,
          test_timestamp: timestamp
        }
      };
      
    case 'slack':
      return {
        text: `🔧 Rising-BSM Webhook Test - ${timestamp}`,
        username: 'Rising-BSM',
        icon_emoji: ':gear:',
        attachments: [{
          color: 'good',
          fields: [{
            title: 'Test Status',
            value: 'Webhook connection test successful',
            short: true
          }]
        }]
      };
      
    case 'discord':
      return {
        content: `🔧 **Rising-BSM Webhook Test**\n\nTimestamp: ${timestamp}\nTest ID: ${testId}`,
        username: 'Rising-BSM',
        embeds: [{
          title: 'Webhook Test',
          description: 'Testing webhook connection from Rising-BSM automation system',
          color: 0x00ff00,
          timestamp
        }]
      };
      
    case 'teams':
      return {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        summary: "Rising-BSM Webhook Test",
        themeColor: "0076D7",
        sections: [{
          activityTitle: "🔧 Rising-BSM Webhook Test",
          activitySubtitle: `Test performed at ${timestamp}`,
          facts: [{
            name: "Status",
            value: "Connection test successful"
          }, {
            name: "Test ID",
            value: testId
          }]
        }]
      };
      
    case 'zapier':
      return {
        ...basePayload,
        webhook_test: true,
        event: 'test',
        message: 'Rising-BSM webhook connection test'
      };
      
    default:
      return basePayload;
  }
}

/**
 * Validates a webhook URL with enhanced service-specific validation
 */
export function validateWebhookUrlEnhanced(url: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  serviceType: string;
  recommendations: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  if (!url?.trim()) {
    errors.push('Webhook URL is required');
    return { isValid: false, errors, warnings, serviceType: 'unknown', recommendations };
  }
  
  let serviceType = 'unknown';
  
  try {
    const parsedUrl = new URL(url);
    
    // Identify service type
    const { type } = identifyWebhookService(url);
    serviceType = type;
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      errors.push('Webhook URL must use HTTP or HTTPS protocol');
    }
    
    // Security recommendations
    if (parsedUrl.protocol === 'http:' && 
        parsedUrl.hostname !== 'localhost' && 
        !parsedUrl.hostname.startsWith('192.168.') && 
        !parsedUrl.hostname.startsWith('127.')) {
      warnings.push('HTTPS is recommended for webhook URLs');
      recommendations.push('Use HTTPS instead of HTTP for better security');
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
    
    // Service-specific recommendations
    if (serviceType === 'n8n') {
      recommendations.push('n8n webhooks only accept POST requests with JSON payloads');
      if (!parsedUrl.pathname.includes('/webhook')) {
        warnings.push('n8n webhook URLs typically contain "/webhook" in the path');
      }
    } else if (serviceType === 'slack') {
      recommendations.push('Slack webhooks require specific JSON format for messages');
    } else if (serviceType === 'discord') {
      recommendations.push('Discord webhooks support rich embeds and mentions');
    } else if (serviceType === 'teams') {
      recommendations.push('Teams webhooks use MessageCard format');
    } else if (serviceType === 'generic') {
      recommendations.push('For generic webhooks, ensure the endpoint can handle your payload format');
    }
    
  } catch (error) {
    errors.push('Invalid URL format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    serviceType,
    recommendations
  };
}

/**
 * Original function exports for backward compatibility
 */
export function validateWebhookUrl(url: string): {
  isValid: boolean;
  errors: string[];
} {
  const result = validateWebhookUrlEnhanced(url);
  return {
    isValid: result.isValid,
    errors: result.errors
  };
}

export async function testWebhookConnection(url: string, headers?: Record<string, string>): Promise<{
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
}> {
  const result = await testWebhookConnectionEnhanced(url, headers);
  return {
    success: result.success,
    responseTime: result.responseTime,
    statusCode: result.statusCode,
    error: result.error
  };
}

// Re-export other utilities from original file
export {
  validateWebhookHeaders,
  validateWebhookConfig,
  WEBHOOK_PATTERNS,
  identifyWebhookType
} from './webhook-validator';

// Export original sanitizeWebhookHeaders for backward compatibility
export { sanitizeWebhookHeaders } from './webhook-validator';



// Helper functions (copied from original for consistency)
function isValidHostname(hostname: string): boolean {
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostnameRegex.test(hostname);
}

function isDangerousUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }
  
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
  ];
  
  for (const range of privateRanges) {
    if (range.test(hostname)) {
      return true;
    }
  }
  
  const blockedPatterns = [
    /^0\.0\.0\.0$/,
    /^255\.255\.255\.255$/,
    /^224\./,
    /^240\./,
  ];
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(hostname)) {
      return true;
    }
  }
  
  return false;
}

function sanitizeWebhookHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [name, value] of Object.entries(headers)) {
    if (!isDangerousHeader(name, value) && isValidHeaderName(name)) {
      sanitized[name] = value;
    }
  }
  
  return sanitized;
}

function isValidHeaderName(name: string): boolean {
  const headerNameRegex = /^[!#$%&'*+-.0-9A-Z^_`|~a-z]+$/;
  return headerNameRegex.test(name);
}

function isDangerousHeader(name: string, value: string): boolean {
  const lowerName = name.toLowerCase();
  
  const dangerousHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
  ];
  
  if (dangerousHeaders.includes(lowerName)) {
    return true;
  }
  
  const suspiciousPatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
  ];
  
  if (lowerName.includes('auth') || lowerName.includes('key') || lowerName.includes('token')) {
    return suspiciousPatterns.some(pattern => pattern.test(value));
  }
  
  return false;
}
