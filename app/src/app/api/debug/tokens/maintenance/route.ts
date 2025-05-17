/**
 * Token Maintenance API
 * 
 * This endpoint provides maintenance operations for refresh tokens.
 * For security, it's only available in development mode.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import { getRefreshTokenRepository } from '@/core/factories/repositoryFactory.server';
import { getErrorHandler } from '@/core/bootstrap/bootstrap.server';
import { configService } from '@/core/config/ConfigService';

const logger = getLogger();
const refreshTokenRepository = getRefreshTokenRepository();
const errorHandler = getErrorHandler();

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Only available in development
  if (!configService.isDevelopment()) {
    return NextResponse.json(
      { message: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    // Parse request to determine cleanup operation
    const data = await request.json().catch(() => ({}));
    const operation = data.operation || 'expired';
    
    let count = 0;
    let message = '';
    
    // Perform the requested operation
    switch (operation) {
      case 'expired':
        // Delete expired tokens
        count = await refreshTokenRepository.deleteMany({
          expiresAt: { lt: new Date() }
        });
        message = `Deleted ${count} expired tokens`;
        break;
        
      case 'revoked':
        // Delete revoked tokens
        count = await refreshTokenRepository.deleteMany({
          isRevoked: true
        });
        message = `Deleted ${count} revoked tokens`;
        break;
        
      case 'all':
        // Delete all tokens (dangerous!)
        if (configService.isDevelopment()) {
          count = await refreshTokenRepository.deleteMany({});
          message = `Deleted all ${count} tokens - system will require re-login`;
        } else {
          return NextResponse.json(
            { 
              success: false,
              message: 'Cannot delete all tokens in production mode'
            },
            { status: 403 }
          );
        }
        break;
        
      default:
        return NextResponse.json(
          { 
            success: false,
            message: 'Invalid operation. Supported operations: expired, revoked, all'
          },
          { status: 400 }
        );
    }
    
    logger.info(`Token cleanup: ${message}`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message,
      count,
      operation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error during token maintenance', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Safely convert any error type to a properly structured error object
    const appError = errorHandler.mapError(
      error instanceof Error ? error : new Error(`Token maintenance error: ${String(error)}`)
    );
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error during token maintenance',
        error: appError.message,
      },
    );
  }
}
