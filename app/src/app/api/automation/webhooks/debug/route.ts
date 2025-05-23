/**
 * Debug route for automation webhooks
 * 
 * GET /api/automation/webhooks/debug - Debug webhook creation
 * POST /api/automation/webhooks/debug - Test body parsing
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';

export async function GET(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('GET /api/automation/webhooks/debug - Debug route accessed');
    
    return NextResponse.json(
      formatResponse.success({
        message: 'Webhook debug route is working',
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(request.headers.entries())
      }),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error in debug route', { error });
    return NextResponse.json(
      formatResponse.error('Debug route error', 500),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const logger = new LoggingService();
  
  try {
    logger.info('POST /api/automation/webhooks/debug - Testing body parsing');
    
    // Get content type
    const contentType = request.headers.get('content-type') || '';
    logger.info('Content-Type header', { contentType });
    
    // Try to read the body
    let body: any = null;
    let bodyText: string | null = null;
    
    try {
      // Clone the request to read body twice
      const clonedRequest = request.clone();
      bodyText = await clonedRequest.text();
      logger.info('Raw body text', { bodyText, length: bodyText.length });
      
      if (contentType.includes('application/json')) {
        body = await request.json();
        logger.info('Parsed JSON body', { body, keys: Object.keys(body || {}) });
      } else {
        logger.warn('Non-JSON content type', { contentType });
      }
    } catch (parseError) {
      logger.error('Body parsing error', { 
        error: parseError,
        contentType,
        bodyText
      });
    }
    
    return NextResponse.json(
      formatResponse.success({
        message: 'Body parsing test complete',
        contentType,
        bodyReceived: !!body,
        bodyKeys: body ? Object.keys(body) : [],
        bodyText: bodyText?.substring(0, 200),
        headers: Object.fromEntries(request.headers.entries())
      }),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error in debug POST route', { error });
    return NextResponse.json(
      formatResponse.error('Debug POST route error', 500),
      { status: 500 }
    );
  }
}
