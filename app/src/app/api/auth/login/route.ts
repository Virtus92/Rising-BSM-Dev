/**
 * Login API Route
 * 
 * This file uses the handler from the features/auth module
 */
import { NextRequest } from 'next/server';
import { loginHandler } from '@/features/auth/api';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';

/**
 * POST /api/auth/login
 * Authenticates a user and returns access and refresh tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Diagnostic logging to help troubleshoot the login issue
    const logger = getLogger();
    logger.info('Login route handling request');
    
    // Verify auth service before delegating to loginHandler
    const serviceFactory = getServiceFactory();
    const authService = serviceFactory.createAuthService();
    
    // Verify the auth service has the login method
    if (!authService || typeof authService.login !== 'function') {
      logger.error('Auth service is missing login method:', {
        authServiceExists: !!authService,
        methods: authService ? Object.keys(authService) : 'none',
        env: typeof window !== 'undefined' ? 'browser' : 'server'
      });
      
      return formatResponse.error('Authentication service unavailable', 500);
    }
    
    // Auth service appears valid, proceed with login handler
    logger.info('Auth service verification passed, delegating to loginHandler');
    return loginHandler(request);
  } catch (error) {
    const logger = getLogger();
    logger.error('Unexpected error in login route:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error('An unexpected error occurred during login', 500);
  }
}
