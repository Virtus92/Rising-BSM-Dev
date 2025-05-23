/**
 * Webhook Testing Utility
 * 
 * A comprehensive testing utility for debugging webhook connectivity issues.
 * Can be used for development and troubleshooting webhook problems.
 */

import { testWebhookConnectionEnhanced, validateWebhookUrlEnhanced, WEBHOOK_SERVICE_CONFIGS } from './webhook-validator.enhanced';

/**
 * Test configuration interface
 */
interface WebhookTestConfig {
  url: string;
  headers?: Record<string, string>;
  description?: string;
  expectedStatus?: number;
}

/**
 * Predefined test cases for common webhook services
 */
export const WEBHOOK_TEST_CASES: WebhookTestConfig[] = [
  {
    url: 'https://httpbin.org/post',
    description: 'HTTPBin Test (Generic POST endpoint)',
    expectedStatus: 200
  },
  {
    url: 'https://httpbin.org/status/200',
    description: 'HTTPBin 200 Response Test',
    expectedStatus: 200
  },
  {
    url: 'https://httpbin.org/status/404',
    description: 'HTTPBin 404 Response Test (Expected to fail)',
    expectedStatus: 404
  },
  {
    url: 'https://webhook.site/unique-id-here',
    description: 'Webhook.site Test (Replace with actual webhook.site URL)',
    expectedStatus: 200
  }
];

/**
 * Comprehensive webhook testing function
 */
export async function runWebhookTests(testConfigs: WebhookTestConfig[] = WEBHOOK_TEST_CASES): Promise<{
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: Array<{
    config: WebhookTestConfig;
    result: any;
    passed: boolean;
    error?: string;
  }>;
}> {
  console.log('🔧 Starting Webhook Connectivity Tests...\n');
  
  const results: Array<{
    config: WebhookTestConfig;
    result: any;
    passed: boolean;
    error?: string;
  }> = [];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const config of testConfigs) {
    console.log(`📡 Testing: ${config.description || config.url}`);
    console.log(`🔗 URL: ${config.url}`);
    
    try {
      // First validate the URL
      const validation = validateWebhookUrlEnhanced(config.url);
      
      console.log(`📋 Service Type: ${validation.serviceType}`);
      
      if (validation.warnings.length > 0) {
        console.log(`⚠️  Warnings: ${validation.warnings.join(', ')}`);
      }
      
      if (validation.recommendations.length > 0) {
        console.log(`💡 Recommendations: ${validation.recommendations.join(', ')}`);
      }
      
      if (!validation.isValid) {
        console.log(`❌ URL Validation Failed: ${validation.errors.join(', ')}`);
        results.push({
          config,
          result: validation,
          passed: false,
          error: `URL validation failed: ${validation.errors.join(', ')}`
        });
        failedTests++;
        console.log('');
        continue;
      }
      
      // Test the webhook connection
      const testResult = await testWebhookConnectionEnhanced(config.url, config.headers);
      
      console.log(`🚀 Method Used: ${testResult.methodUsed}`);
      console.log(`⏱️  Response Time: ${testResult.responseTime}ms`);
      console.log(`📊 Status Code: ${testResult.statusCode || 'Unknown'}`);
      
      // Determine if test passed
      const expectedSuccess = config.expectedStatus ? config.expectedStatus < 400 : true;
      const expectedStatus = config.expectedStatus || 200;
      
      const passed = testResult.success === expectedSuccess && 
                    (testResult.statusCode === expectedStatus || !config.expectedStatus);
      
      if (passed) {
        console.log('✅ Test PASSED');
        passedTests++;
      } else {
        console.log('❌ Test FAILED');
        if (testResult.error) {
          console.log(`🚨 Error: ${testResult.error}`);
        }
        failedTests++;
      }
      
      results.push({
        config,
        result: testResult,
        passed,
        error: testResult.error
      });
      
    } catch (error) {
      console.log(`💥 Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        config,
        result: null,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      failedTests++;
    }
    
    console.log(''); // Add spacing between tests
  }
  
  // Summary
  console.log('📈 Test Summary:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total: ${testConfigs.length}`);
  console.log(`🎯 Success Rate: ${Math.round((passedTests / testConfigs.length) * 100)}%`);
  
  return {
    totalTests: testConfigs.length,
    passedTests,
    failedTests,
    results
  };
}

/**
 * Test a specific webhook URL
 */
export async function testSpecificWebhook(
  url: string, 
  headers?: Record<string, string>
): Promise<void> {
  console.log('🔧 Testing Specific Webhook...\n');
  
  await runWebhookTests([{
    url,
    headers,
    description: 'User-provided webhook URL'
  }]);
}

/**
 * Test n8n webhook specifically (for debugging the original issue)
 */
export async function testN8nWebhook(webhookId: string): Promise<void> {
  const n8nUrl = `https://n8n.dinel.at/webhook-test/${webhookId}`;
  
  console.log('🔧 Testing n8n Webhook Specifically...\n');
  console.log('This test addresses the original 404 issue by using POST instead of HEAD\n');
  
  await testSpecificWebhook(n8nUrl);
}

/**
 * Generate test report
 */
export function generateTestReport(results: any): string {
  const timestamp = new Date().toISOString();
  
  let report = `# Webhook Testing Report\n\nGenerated: ${timestamp}\n\n`;
  
  report += `## Summary\n`;
  report += `- **Total Tests**: ${results.totalTests}\n`;
  report += `- **Passed**: ${results.passedTests}\n`;
  report += `- **Failed**: ${results.failedTests}\n`;
  report += `- **Success Rate**: ${Math.round((results.passedTests / results.totalTests) * 100)}%\n\n`;
  
  report += `## Detailed Results\n\n`;
  
  results.results.forEach((result: any, index: number) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    report += `### Test ${index + 1}: ${result.config.description || result.config.url}\n`;
    report += `- **Status**: ${status}\n`;
    report += `- **URL**: ${result.config.url}\n`;
    
    if (result.result) {
      if (result.result.serviceType) {
        report += `- **Service Type**: ${result.result.serviceType}\n`;
      }
      if (result.result.methodUsed) {
        report += `- **Method Used**: ${result.result.methodUsed}\n`;
      }
      if (result.result.responseTime) {
        report += `- **Response Time**: ${result.result.responseTime}ms\n`;
      }
      if (result.result.statusCode) {
        report += `- **Status Code**: ${result.result.statusCode}\n`;
      }
    }
    
    if (result.error) {
      report += `- **Error**: ${result.error}\n`;
    }
    
    report += '\n';
  });
  
  return report;
}

/**
 * Usage examples and documentation
 */
export const USAGE_EXAMPLES = {
  // Test the original failing n8n webhook
  testOriginalIssue: () => testN8nWebhook('a02796de-2ef0-4029-ad1a-5ad244b96163'),
  
  // Test a custom webhook
  testCustom: (url: string, headers?: Record<string, string>) => testSpecificWebhook(url, headers),
  
  // Run all predefined tests
  testAll: () => runWebhookTests(),
  
  // Test with custom configuration
  testCustomConfig: (configs: WebhookTestConfig[]) => runWebhookTests(configs)
};

// Export for direct usage
export default {
  runWebhookTests,
  testSpecificWebhook,
  testN8nWebhook,
  generateTestReport,
  WEBHOOK_TEST_CASES,
  USAGE_EXAMPLES
};
