/**
 * Enhanced webhook header utilities
 * 
 * Provides controlled header sanitization that allows necessary auth headers
 * while still protecting against injection attacks
 */

/**
 * Webhook testing context - allows auth headers for testing
 */
export interface WebhookTestContext {
  isTest?: boolean;
  allowAuthHeaders?: boolean;
  trustedDomains?: string[];
}

/**
 * Enhanced header sanitization with context awareness
 */
export function sanitizeWebhookHeadersEnhanced(
  headers: Record<string, string>,
  context?: WebhookTestContext
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [name, value] of Object.entries(headers)) {
    // Always validate header name format
    if (!isValidHeaderName(name)) {
      console.warn(`[Header Sanitizer] Skipping invalid header name: ${name}`);
      continue;
    }
    
    // Check if this is a potentially sensitive header
    const lowerName = name.toLowerCase();
    const isSensitiveHeader = [
      'authorization',
      'x-api-key',
      'x-auth-token',
      'apikey',
      'token',
      'x-webhook-signature',
      'x-hub-signature'
    ].some(sensitive => lowerName.includes(sensitive));
    
    if (isSensitiveHeader) {
      // For testing context, allow auth headers
      if (context?.isTest || context?.allowAuthHeaders) {
        console.log(`[Header Sanitizer] Allowing auth header for testing: ${name}`);
        sanitized[name] = value;
      } else {
        console.warn(`[Header Sanitizer] Blocking sensitive header: ${name}`);
      }
    } else {
      // For non-sensitive headers, just validate the value
      if (isValidHeaderValue(value)) {
        sanitized[name] = value;
      } else {
        console.warn(`[Header Sanitizer] Skipping header with invalid value: ${name}`);
      }
    }
  }
  
  return sanitized;
}

/**
 * Validates header name format
 */
function isValidHeaderName(name: string): boolean {
  const headerNameRegex = /^[!#$%&'*+-.0-9A-Z^_`|~a-z]+$/;
  return headerNameRegex.test(name);
}

/**
 * Validates header value to prevent injection
 */
function isValidHeaderValue(value: string): boolean {
  // Reject values with control characters or line breaks
  if (/[\x00-\x1F\x7F\r\n]/.test(value)) {
    return false;
  }
  
  // Reject suspiciously long values
  if (value.length > 8192) {
    return false;
  }
  
  return true;
}

/**
 * Creates a safe header configuration for webhook testing
 */
export function createSafeTestHeaders(
  userHeaders: Record<string, string> = {},
  webhookUrl: string
): Record<string, string> {
  const url = new URL(webhookUrl);
  const domain = url.hostname;
  
  // Determine if this is a known webhook service
  const trustedServices = [
    'n8n.cloud',
    'n8n.dinel.at',
    'hooks.slack.com',
    'discord.com',
    'webhook.office.com',
    'hooks.zapier.com'
  ];
  
  const isTrustedService = trustedServices.some(service => 
    domain.includes(service)
  );
  
  // Sanitize headers with appropriate context
  const context: WebhookTestContext = {
    isTest: true,
    allowAuthHeaders: isTrustedService,
    trustedDomains: trustedServices
  };
  
  const sanitized = sanitizeWebhookHeadersEnhanced(userHeaders, context);
  
  // Add default headers that won't interfere
  return {
    'User-Agent': 'Rising-BSM-Automation/1.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...sanitized
  };
}

/**
 * Logs header sanitization for debugging
 */
export function debugHeaders(
  original: Record<string, string>,
  sanitized: Record<string, string>
): void {
  const removed = Object.keys(original).filter(key => !(key in sanitized));
  
  if (removed.length > 0) {
    console.log('[Header Debug] Headers removed during sanitization:', removed);
  }
  
  console.log('[Header Debug] Final headers:', Object.keys(sanitized));
}
