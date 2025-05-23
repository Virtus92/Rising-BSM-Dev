/**
 * Webhook Diagnostic Route Handler
 * 
 * Performs comprehensive webhook diagnostics to identify configuration issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';

interface DiagnoseWebhookRequest {
  webhookUrl: string;
  headers?: Record<string, string>;
}

export async function diagnoseWebhookRoute(request: NextRequest): Promise<NextResponse> {
  const logger = new LoggingService();
  const startTime = Date.now();
  
  try {
    logger.info('POST /api/automation/webhooks/diagnose - Starting webhook diagnostics');
    
    // Parse request body
    let body: DiagnoseWebhookRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn('Failed to parse request body', { parseError });
      return NextResponse.json(
        formatResponse.error('Invalid JSON in request body', 400),
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.webhookUrl) {
      return NextResponse.json(
        formatResponse.error('Webhook URL is required', 400),
        { status: 400 }
      );
    }
    
    const diagnosticResults: any = {
      url: body.webhookUrl,
      timestamp: new Date().toISOString(),
      tests: []
    };
    
    // Test 1: HTTP Methods
    logger.info('Running HTTP methods test');
    const methodTests = await testHttpMethods(body.webhookUrl, body.headers);
    diagnosticResults.tests.push({
      name: 'HTTP Methods',
      results: methodTests
    });
    
    // Test 2: Content Types (POST only)
    logger.info('Running content type test');
    const contentTypeTests = await testContentTypes(body.webhookUrl, body.headers);
    diagnosticResults.tests.push({
      name: 'Content Types',
      results: contentTypeTests
    });
    
    // Test 3: URL Variations
    logger.info('Running URL variations test');
    const urlTests = await testUrlVariations(body.webhookUrl, body.headers);
    diagnosticResults.tests.push({
      name: 'URL Variations',
      results: urlTests
    });
    
    // Test 4: Authentication
    logger.info('Running authentication test');
    const authTests = await testAuthentication(body.webhookUrl, body.headers);
    diagnosticResults.tests.push({
      name: 'Authentication',
      results: authTests
    });
    
    // Generate summary
    const summary = generateDiagnosticSummary(diagnosticResults);
    diagnosticResults.summary = summary;
    
    const totalTime = Date.now() - startTime;
    logger.info('Webhook diagnostics completed', { totalTime });
    
    return NextResponse.json(
      formatResponse.success(diagnosticResults, 'Webhook diagnostics completed'),
      { status: 200 }
    );
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error('Error in webhook diagnostics', { error, totalTime });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Diagnostics failed',
        500,
        'DIAGNOSTICS_ERROR'
      ),
      { status: 500 }
    );
  }
}

async function testHttpMethods(url: string, headers?: Record<string, string>) {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  const results = [];
  
  for (const method of methods) {
    try {
      // Create headers object
      const requestHeaders: Record<string, string> = {
        'User-Agent': 'Rising-BSM-Diagnostic/1.0',
        'Accept': 'application/json, text/plain, */*'
      };
      
      // Add custom headers if provided
      if (headers) {
        Object.assign(requestHeaders, headers);
      }
      
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        signal: AbortSignal.timeout(5000)
      });
      
      const result: any = {
        method,
        status: response.status,
        statusText: response.statusText,
        success: response.ok
      };
      
      if (method === 'OPTIONS') {
        result.allowedMethods = response.headers.get('allow') || 'Not specified';
      }
      
      results.push(result);
    } catch (error) {
      results.push({
        method,
        error: error instanceof Error ? error.message : 'Request failed',
        success: false
      });
    }
  }
  
  return results;
}

async function testContentTypes(url: string, headers?: Record<string, string>) {
  const contentTypes = [
    { 
      type: 'application/json', 
      body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }) 
    },
    { 
      type: 'application/x-www-form-urlencoded', 
      body: 'test=true&source=rising-bsm' 
    },
    { 
      type: 'text/plain', 
      body: 'test webhook from Rising-BSM' 
    }
  ];
  
  const results = [];
  
  for (const { type, body } of contentTypes) {
    try {
      // Create headers object
      const requestHeaders: Record<string, string> = {
        'User-Agent': 'Rising-BSM-Diagnostic/1.0',
        'Content-Type': type
      };
      
      // Add custom headers if provided
      if (headers) {
        Object.assign(requestHeaders, headers);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body,
        signal: AbortSignal.timeout(5000)
      });
      
      results.push({
        contentType: type,
        status: response.status,
        statusText: response.statusText,
        success: response.ok
      });
    } catch (error) {
      results.push({
        contentType: type,
        error: error instanceof Error ? error.message : 'Request failed',
        success: false
      });
    }
  }
  
  return results;
}

async function testUrlVariations(url: string, headers?: Record<string, string>) {
  const variations = [];
  
  // Original URL
  variations.push({ name: 'Original', url });
  
  // With/without trailing slash
  if (url.endsWith('/')) {
    variations.push({ name: 'Without trailing slash', url: url.slice(0, -1) });
  } else {
    variations.push({ name: 'With trailing slash', url: url + '/' });
  }
  
  // With query parameter
  const separator = url.includes('?') ? '&' : '?';
  variations.push({ name: 'With query param', url: url + separator + 'test=true' });
  
  const results = [];
  
  for (const { name, url: testUrl } of variations) {
    try {
      // Create headers object
      const requestHeaders: Record<string, string> = {
        'User-Agent': 'Rising-BSM-Diagnostic/1.0',
        'Content-Type': 'application/json'
      };
      
      // Add custom headers if provided
      if (headers) {
        Object.assign(requestHeaders, headers);
      }
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({ test: true }),
        signal: AbortSignal.timeout(5000)
      });
      
      results.push({
        variation: name,
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        success: response.ok
      });
    } catch (error) {
      results.push({
        variation: name,
        url: testUrl,
        error: error instanceof Error ? error.message : 'Request failed',
        success: false
      });
    }
  }
  
  return results;
}

async function testAuthentication(url: string, headers?: Record<string, string>) {
  const authVariations = [
    { name: 'No Auth', headers: {} },
    { name: 'Bearer Token', headers: { 'Authorization': 'Bearer test-token' } },
    { name: 'API Key', headers: { 'X-API-Key': 'test-api-key' } },
    { name: 'Basic Auth', headers: { 'Authorization': 'Basic dGVzdDp0ZXN0' } }
  ];
  
  const results = [];
  
  for (const { name, headers: authHeaders } of authVariations) {
    try {
      // Create headers object without optional properties
      const requestHeaders: Record<string, string> = {
        'User-Agent': 'Rising-BSM-Diagnostic/1.0',
        'Content-Type': 'application/json'
      };
      
      // Add auth headers
      Object.assign(requestHeaders, authHeaders);
      
      // Add custom headers if provided
      if (headers) {
        Object.assign(requestHeaders, headers);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({ test: true }),
        signal: AbortSignal.timeout(5000)
      });
      
      results.push({
        authType: name,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        requiresAuth: response.status === 401 || response.status === 403
      });
    } catch (error) {
      results.push({
        authType: name,
        error: error instanceof Error ? error.message : 'Request failed',
        success: false
      });
    }
  }
  
  return results;
}

function generateDiagnosticSummary(diagnostics: any) {
  const summary: any = {
    workingConfigurations: [],
    issues: [],
    recommendations: []
  };
  
  // Check HTTP methods
  const methodTest = diagnostics.tests.find((t: any) => t.name === 'HTTP Methods');
  if (methodTest) {
    const workingMethods = methodTest.results
      .filter((r: any) => r.success)
      .map((r: any) => r.method);
    
    if (workingMethods.length > 0) {
      summary.workingConfigurations.push(`HTTP Methods: ${workingMethods.join(', ')}`);
    } else {
      summary.issues.push('No HTTP methods returned success');
    }
    
    // Check if it's a 404 for all methods
    const all404 = methodTest.results.every((r: any) => r.status === 404);
    if (all404) {
      summary.issues.push('All methods return 404 - webhook may not exist');
      summary.recommendations.push('Verify the webhook URL is correct');
      summary.recommendations.push('Check if the webhook has been deleted or deactivated');
    }
  }
  
  // Check content types
  const contentTest = diagnostics.tests.find((t: any) => t.name === 'Content Types');
  if (contentTest) {
    const workingTypes = contentTest.results
      .filter((r: any) => r.success)
      .map((r: any) => r.contentType);
    
    if (workingTypes.length > 0) {
      summary.workingConfigurations.push(`Content Types: ${workingTypes.join(', ')}`);
    }
  }
  
  // Check URL variations
  const urlTest = diagnostics.tests.find((t: any) => t.name === 'URL Variations');
  if (urlTest) {
    const workingUrls = urlTest.results.filter((r: any) => r.success);
    
    if (workingUrls.length > 0) {
      workingUrls.forEach((r: any) => {
        summary.workingConfigurations.push(`URL Variation: ${r.variation} works`);
      });
    }
    
    // Check if a different URL pattern works
    const alternativeWorks = urlTest.results.find((r: any) => 
      r.success && r.variation !== 'Original'
    );
    
    if (alternativeWorks) {
      summary.recommendations.push(`Use this URL format: ${alternativeWorks.url}`);
    }
  }
  
  // Check authentication
  const authTest = diagnostics.tests.find((t: any) => t.name === 'Authentication');
  if (authTest) {
    const requiresAuth = authTest.results.some((r: any) => r.requiresAuth);
    
    if (requiresAuth) {
      summary.issues.push('Webhook requires authentication');
      summary.recommendations.push('Add appropriate authentication headers');
    }
  }
  
  return summary;
}
