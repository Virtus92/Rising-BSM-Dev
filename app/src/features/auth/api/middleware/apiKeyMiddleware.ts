/**
 * API Key Authentication Middleware
 * 
 * Provides secure API key-based authentication for API routes with integrated
 * rate limiting, comprehensive validation, and audit logging.
 */

import { NextRequest } from 'next/server';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { ApiKeyGenerator } from '@/core/security/api-key-utils';
import { checkApiKeyRateLimit, RateLimitResult } from '@/core/security/rate-limiting';

const logger = getLogger();

/**
 * Result of API key authentication
 */
export interface ApiKeyAuthResult {
  success: boolean;
  apiKeyId?: number;
  permissions?: string[];
  type?: 'admin' | 'standard';
  environment?: 'production' | 'development';
  message?: string;
  keyPreview?: string;
  rateLimit?: RateLimitResult;
  rateLimitExceeded?: boolean;
}

/**
 * API Key authentication middleware
 * 
 * Validates API key, checks permissions, enforces rate limits, and tracks usage.
 * 
 * @param req - Next.js request object
 * @returns Authentication result with comprehensive validation
 */
export async function apiKeyMiddleware(req: NextRequest): Promise<ApiKeyAuthResult> {
  const startTime = performance.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID().substring(0, 8);
  
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return {
        success: false,
        message: 'Missing Authorization header'
      };
    }

    // Support Bearer and ApiKey schemes
    let apiKey: string | null = null;
    let isJwtToken = false;
    
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if this looks like an API key (starts with rk_live_ or rk_test_)
      if (token.startsWith('rk_live_') || token.startsWith('rk_test_')) {
        apiKey = token;
      } else {
        // This is likely a JWT token, not an API key - fail silently
        isJwtToken = true;
      }
    } else if (authHeader.startsWith('ApiKey ')) {
      apiKey = authHeader.substring(7);
    }
    
    // If this is a JWT token, fail silently without warnings
    if (isJwtToken) {
      return {
        success: false,
        message: 'Not an API key'
      };
    }
    
    // If no API key scheme detected, return error
    if (!apiKey) {
      return {
        success: false,
        message: 'Invalid Authorization header format. Use "Bearer <api_key>" or "ApiKey <api_key>"'
      };
    }

    // Validate API key format (only log warnings for actual API key attempts)
    if (!ApiKeyGenerator.isValidFormat(apiKey)) {
      logger.warn('Invalid API key format attempted', {
        requestId,
        keyPreview: ApiKeyGenerator.maskForLogging(apiKey),
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '::1'
      });
      
      return {
        success: false,
        message: 'Invalid API key format'
      };
    }

    // Hash API key for database lookup
    const keyHash = ApiKeyGenerator.hashApiKey(apiKey);
    const keyPreview = ApiKeyGenerator.createPreview(apiKey);
    
    // Get API key service and validate
    const serviceFactory = getServiceFactory();
    const apiKeyService = serviceFactory.createApiKeyService();
    
    const validation = await apiKeyService.validateApiKey(keyHash);
    
    if (!validation.valid) {
      logger.warn('API key validation failed', {
        requestId,
        keyPreview,
        reason: validation.reason,
        revokedReason: validation.revokedReason,
        isExpired: validation.isExpired
      });
      
      return {
        success: false,
        message: validation.revokedReason || validation.reason || 'Invalid or expired API key',
        keyPreview
      };
    }

    // Check rate limits
    const rateLimitResult = await checkApiKeyRateLimit(
      validation.apiKeyId!,
      validation.type as 'admin' | 'standard'
    );
    
    if (rateLimitResult.exceeded) {
      logger.warn('API key rate limit exceeded', {
        requestId,
        keyPreview,
        apiKeyId: validation.apiKeyId,
        currentRequests: rateLimitResult.currentRequests,
        resetTime: rateLimitResult.resetTime
      });
      
      return {
        success: false,
        message: `Rate limit exceeded. Try again after ${rateLimitResult.resetTime.toISOString()}`,
        keyPreview,
        rateLimit: rateLimitResult,
        rateLimitExceeded: true
      };
    }

    // Update usage tracking (async, non-blocking)
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';
    
    apiKeyService.updateUsage(keyHash, ipAddress).catch(error => {
      logger.warn('Failed to update API key usage', { 
        error: error instanceof Error ? error.message : String(error),
        requestId,
        keyPreview
      });
    });

    const processingTime = Math.round(performance.now() - startTime);
    
    logger.debug('API key authentication successful', {
      requestId,
      keyPreview,
      apiKeyId: validation.apiKeyId,
      type: validation.type,
      environment: validation.environment,
      permissionCount: validation.permissions?.length || 0,
      remainingRequests: rateLimitResult.remainingRequests,
      processingTimeMs: processingTime
    });

    return {
      success: true,
      apiKeyId: validation.apiKeyId,
      permissions: validation.permissions,
      type: validation.type as 'admin' | 'standard',
      environment: validation.environment as 'production' | 'development',
      keyPreview,
      rateLimit: rateLimitResult,
      rateLimitExceeded: false
    };
    
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    
    logger.error('API key middleware error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
      processingTimeMs: processingTime
    });
    
    return {
      success: false,
      message: 'Internal authentication error'
    };
  }
}

/**
 * Extract API key information from request for logging/debugging
 * 
 * @param req - Next.js request object
 * @returns API key information (masked for security)
 */
export function extractApiKeyInfo(req: NextRequest): {
  hasApiKey: boolean;
  keyPreview?: string;
  authScheme?: string;
} {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return { hasApiKey: false };
  }
  
  let authScheme: string;
  let apiKey: string | null = null;
  
  if (authHeader.startsWith('Bearer ')) {
    authScheme = 'Bearer';
    const potentialKey = authHeader.substring(7);
    // Only consider it an API key if it has the right format
    if (ApiKeyGenerator.isValidFormat(potentialKey)) {
      apiKey = potentialKey;
    }
  } else if (authHeader.startsWith('ApiKey ')) {
    authScheme = 'ApiKey';
    apiKey = authHeader.substring(7);
  } else {
    return { hasApiKey: false };
  }
  
  return {
    hasApiKey: !!apiKey,
    keyPreview: apiKey ? ApiKeyGenerator.maskForLogging(apiKey) : undefined,
    authScheme
  };
}

/**
 * Validate API key authentication for a request
 * 
 * @param req - Next.js request object
 * @returns Promise resolving to authentication result
 */
export async function validateApiKeyAuth(req: NextRequest): Promise<ApiKeyAuthResult> {
  return apiKeyMiddleware(req);
}
