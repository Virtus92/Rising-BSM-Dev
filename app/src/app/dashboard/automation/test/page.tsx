'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';

export default function AutomationTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, result: any, success: boolean) => {
    setTestResults(prev => [{
      test,
      result,
      success,
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const testDebugRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/automation/webhooks/debug');
      const data = await response.json();
      addResult('Debug Route GET', data, response.ok);
    } catch (error) {
      addResult('Debug Route GET', error, false);
    }
    setLoading(false);
  };

  const testBodyParsing = async () => {
    setLoading(true);
    try {
      const testBody = {
        test: true,
        timestamp: new Date().toISOString(),
        nested: { value: 123 }
      };
      
      const response = await fetch('/api/automation/webhooks/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testBody)
      });
      
      const data = await response.json();
      addResult('Body Parsing Test', data, response.ok);
    } catch (error) {
      addResult('Body Parsing Test', error, false);
    }
    setLoading(false);
  };

  const testWebhookCreation = async () => {
    setLoading(true);
    try {
      const webhookData = {
        name: 'Test Webhook ' + Date.now(),
        description: 'Created from test page',
        entityType: AutomationEntityType.CUSTOMER,
        operation: AutomationOperation.CREATE,
        webhookUrl: 'https://webhook.site/test-' + Date.now(),
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Header': 'test-value'
        },
        payloadTemplate: {
          event: 'customer.created',
          timestamp: '{{timestamp}}',
          customer: '{{entity}}'
        },
        active: true,
        retryCount: 3,
        retryDelaySeconds: 30
      };
      
      console.log('Sending webhook data:', webhookData);
      
      const response = await fetch('/api/automation/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });
      
      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { error: 'Failed to parse response', responseText };
      }
      
      addResult('Webhook Creation', data, response.ok);
    } catch (error) {
      console.error('Webhook creation error:', error);
      addResult('Webhook Creation', error, false);
    }
    setLoading(false);
  };

  const testGetWebhooks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/automation/webhooks');
      const data = await response.json();
      addResult('Get Webhooks', data, response.ok);
    } catch (error) {
      addResult('Get Webhooks', error, false);
    }
    setLoading(false);
  };

  const testDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/automation/dashboard');
      const data = await response.json();
      addResult('Get Dashboard', data, response.ok);
    } catch (error) {
      addResult('Get Dashboard', error, false);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automation System Test Page</CardTitle>
          <CardDescription>
            Debug and test the automation API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={testDebugRoute} disabled={loading}>
                Test Debug Route
              </Button>
              <Button onClick={testBodyParsing} disabled={loading} variant="outline">
                Test Body Parsing
              </Button>
              <Button onClick={testWebhookCreation} disabled={loading} variant="default">
                Test Webhook Creation
              </Button>
              <Button onClick={testGetWebhooks} disabled={loading} variant="outline">
                Test Get Webhooks
              </Button>
              <Button onClick={testDashboard} disabled={loading} variant="outline">
                Test Dashboard
              </Button>
              <Button onClick={clearResults} variant="destructive" disabled={loading}>
                Clear Results
              </Button>
            </div>
            
            <Alert>
              <AlertDescription>
                Open the browser console to see detailed logs
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            {testResults.length} test(s) executed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <Card key={index} className={result.success ? 'border-green-500' : 'border-red-500'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{result.test}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.success ? 'Success' : 'Failed'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(result.result, null, 2)}
                    readOnly
                    className="font-mono text-xs"
                    rows={10}
                  />
                </CardContent>
              </Card>
            ))}
            
            {testResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No test results yet. Click a test button above to start.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
