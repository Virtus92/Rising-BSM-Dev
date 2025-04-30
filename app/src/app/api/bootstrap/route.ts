import { NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';

/**
 * Bootstrap API endpoint
 * This route is responsible for initializing server-side services and configurations
 * It uses server-only bootstrapping to ensure proper initialization
 */
export async function GET(request: Request) {
  const logger = getLogger();
  
  // Extract request information for debugging
  const requestHeaders = new Headers(request.headers);
  const clientId = requestHeaders.get('X-Request-ID') || 'unknown';
  const clientSource = requestHeaders.get('X-Client-Source') || 'unknown';
  
  logger.info(`Bootstrap API called from ${clientSource} (ID: ${clientId})`);
  
  try {
    // Server-side bootstrap only - no environment detection needed in API route
    // The file is already server-side by definition
    const { bootstrapServer } = await import('@/core/bootstrap/bootstrap.server');
    
    // Run bootstrap with error handling
    await bootstrapServer().catch(error => {
      logger.error('Error in server bootstrap:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error; // Re-throw to be caught by the outer try/catch
    });
    
    // Return success response
    return NextResponse.json({
      success: true, 
      message: 'Server bootstrap completed successfully',
      timestamp: new Date().toISOString(),
      environment: 'server'
    });
  } catch (error) {
    logger.error('Bootstrap API error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Bootstrap failed', 
      error: errorMessage,
      timestamp: new Date().toISOString() 
    }, { 
      status: 500 
    });
  }
}