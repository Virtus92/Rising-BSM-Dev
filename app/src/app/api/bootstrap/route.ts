import { NextResponse } from 'next/server';
import { bootstrap } from '@/core/bootstrap';

/**
 * Bootstrap API endpoint
 * This route is responsible for initializing server-side services and configurations
 * It uses environment-aware bootstrapping to avoid environment mismatches
 */
export async function GET(request: Request) {
  // Extract request information for debugging
  const requestHeaders = new Headers(request.headers);
  const clientId = requestHeaders.get('X-Request-ID') || 'unknown';
  const clientSource = requestHeaders.get('X-Client-Source') || 'unknown';
  
  console.log(`Bootstrap API called from ${clientSource} (ID: ${clientId})`);
  
  try {
    // Use server-only bootstrap flag to prevent environment detection issues
    const isServerSide = true;
    
    if (isServerSide) {
      try {
        // Import the server bootstrap directly to avoid router detection issues
        const { bootstrapServer } = await import('@/core/bootstrap/bootstrap.server');
        await bootstrapServer();
        
        return NextResponse.json({
          success: true, 
          message: 'Server bootstrap completed successfully',
          timestamp: new Date().toISOString(),
          environment: 'server'
        });
      } catch (serverError) {
        console.warn('Server bootstrap failed, fallback to client bootstrap:', serverError);
        
        // Fallback to client bootstrap if server bootstrap fails
        const { bootstrapClient } = await import('@/core/bootstrap/bootstrap.client');
        await bootstrapClient();
        
        return NextResponse.json({
          success: true, 
          message: 'Client bootstrap completed successfully (server bootstrap failed)',
          timestamp: new Date().toISOString(),
          environment: 'client',
          fallback: true
        });
      }
    } else {
      // Fallback to use the environment-aware bootstrap
      await bootstrap();
      
      return NextResponse.json({
        success: true, 
        message: 'Bootstrap completed successfully (auto-detection)',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Bootstrap API error:', error as Error);
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