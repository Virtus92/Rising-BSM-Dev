/**
 * Token Health Diagnostic API
 * 
 * This endpoint provides diagnostic information about refresh tokens.
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Only available in development
  if (!configService.isDevelopment()) {
    return NextResponse.json(
      { message: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    // Get basic token statistics
    const total = await refreshTokenRepository.count();
    const active = await refreshTokenRepository.count({ isRevoked: false });
    const expired = await refreshTokenRepository.count({
      expiresAt: { lt: new Date() }
    });
    const revoked = await refreshTokenRepository.count({ isRevoked: true });

    // Return token health metrics
    return NextResponse.json({
      success: true,
      data: {
        total,
        active,
        expired,
        revoked,
        activeNonExpired: active - expired,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching token health metrics', error as Error);
    
    const appError = errorHandler.mapError(error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching token metrics',
        error: appError.message
      },
      { status: 500 }
    );
  }
}
