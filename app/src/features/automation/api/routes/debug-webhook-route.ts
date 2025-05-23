/**
 * Webhook Debug/Test Utility API Route
 * 
 * POST /api/automation/webhooks/debug - Debug webhook connectivity issues
 * 
 * This endpoint provides advanced debugging capabilities for webhook testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { runWebhookTests, testSpecificWebhook, testN8nWebhook, generateTestReport, WEBHOOK_TEST_CASES } from '../../lib/utils/webhook-test-utility';

interface DebugWebhookRequest {
  mode: 'single' | 'batch' | 'n8n' | 'predefined';
  url?: string;
  headers?: Record<string, string>;
  n8nWebhookId?: string;
  testConfigs?: Array<{
    url: string;
    headers?: Record<string, string>;
    description?: string;
    expectedStatus?: number;
  }>;
}

/**
 * Webhook debug endpoint
 */
export async function debugWebhookRoute(request: NextRequest): Promise<NextResponse> {
  const logger = new LoggingService();
  const startTime = Date.now();
  
  try {
    logger.info('POST /api/automation/webhooks/debug - Starting webhook debug session');
    
    // Parse request body
    let body: DebugWebhookRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn('Failed to parse request body', { parseError });
      return NextResponse.json(
        formatResponse.error('Invalid JSON in request body', 400),
        { status: 400 }
      );
    }
    
    let results: any = {};
    
    switch (body.mode) {
      case 'single':
        if (!body.url) {
          return NextResponse.json(
            formatResponse.error('URL is required for single mode', 400),
            { status: 400 }
          );
        }
        
        logger.info('Running single webhook test', { url: body.url });
        
        // Capture console output for single test
        const singleTestResults = await runWebhookTests([{
          url: body.url,
          headers: body.headers,
          description: 'Debug test for specific URL'
        }]);
        
        results = singleTestResults;
        break;
        
      case 'n8n':
        if (!body.n8nWebhookId) {
          return NextResponse.json(
            formatResponse.error('n8nWebhookId is required for n8n mode', 400),
            { status: 400 }
          );
        }
        
        logger.info('Running n8n webhook test', { webhookId: body.n8nWebhookId });
        
        const n8nUrl = `https://n8n.dinel.at/webhook-test/${body.n8nWebhookId}`;
        const n8nResults = await runWebhookTests([{
          url: n8nUrl,
          description: `n8n webhook test for ID: ${body.n8nWebhookId}`
        }]);
        
        results = n8nResults;
        break;
        
      case 'batch':
        if (!body.testConfigs || !Array.isArray(body.testConfigs)) {
          return NextResponse.json(
            formatResponse.error('testConfigs array is required for batch mode', 400),
            { status: 400 }
          );
        }
        
        logger.info('Running batch webhook tests', { count: body.testConfigs.length });
        
        results = await runWebhookTests(body.testConfigs);
        break;
        
      case 'predefined':
        logger.info('Running predefined webhook tests');
        
        results = await runWebhookTests(WEBHOOK_TEST_CASES);
        break;
        
      default:
        return NextResponse.json(
          formatResponse.error('Invalid mode. Use: single, batch, n8n, or predefined', 400),
          { status: 400 }
        );
    }
    
    const totalTime = Date.now() - startTime;
    
    // Generate a detailed report
    const report = generateTestReport(results);
    
    logger.info('Webhook debug session completed', {
      mode: body.mode,
      totalTests: results.totalTests,
      passedTests: results.passedTests,
      failedTests: results.failedTests,
      totalTime
    });
    
    return NextResponse.json(
      formatResponse.success(
        {
          ...results,
          report,
          debugInfo: {
            mode: body.mode,
            totalExecutionTime: totalTime,
            timestamp: new Date().toISOString()
          }
        },
        `Debug session completed: ${results.passedTests}/${results.totalTests} tests passed`
      ),
      { status: 200 }
    );
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    logger.error('Error in webhook debug route', { 
      error,
      totalTime,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Debug session failed',
        500,
        'DEBUG_SESSION_ERROR',
        {
          totalTime,
          timestamp: new Date().toISOString()
        }
      ),
      { status: 500 }
    );
  }
}
