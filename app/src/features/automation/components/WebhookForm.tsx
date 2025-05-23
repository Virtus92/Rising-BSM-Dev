'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { 
  Plus, 
  Minus, 
  TestTube, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { useAutomation } from '../hooks/useAutomation';
import { CreateWebhookRequest } from '../api/models';
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';

interface WebhookFormProps {
  webhook?: any; // For editing existing webhook
  onClose: () => void;
  onSuccess: () => void;
}

export function WebhookForm({ webhook, onClose, onSuccess }: WebhookFormProps) {
  const { createWebhook, updateWebhook, testWebhook, loading } = useAutomation();
  
  const [formData, setFormData] = useState<CreateWebhookRequest>({
    name: webhook?.name || '',
    description: webhook?.description || '',
    entityType: webhook?.entityType || AutomationEntityType.CUSTOMER,
    operation: webhook?.operation || AutomationOperation.CREATE,
    webhookUrl: webhook?.webhookUrl || '',
    headers: webhook?.headers || {},
    payloadTemplate: webhook?.payloadTemplate || {},
    active: webhook?.active ?? true,
    retryCount: webhook?.retryCount || 3,
    retryDelaySeconds: webhook?.retryDelaySeconds || 30
  });

  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [showHeaderValues, setShowHeaderValues] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entityTypes = Object.values(AutomationEntityType);
  const operations = Object.values(AutomationOperation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      let result;
      if (webhook?.id) {
        result = await updateWebhook(webhook.id.toString(), formData);
      } else {
        result = await createWebhook(formData);
      }
      
      if (result) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving webhook:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setFormData(prev => ({
        ...prev,
        headers: {
          ...prev.headers,
          [newHeaderKey]: newHeaderValue
        }
      }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData(prev => ({
      ...prev,
      headers: newHeaders
    }));
  };

  const handleTestWebhook = async () => {
    try {
      setTestError('');
      setTestResult(null);
      
      // Build test payload using the actual payload template if available
      let testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        entityType: formData.entityType,
        operation: formData.operation
      };
      
      // If payload template exists, use it as a base
      if (formData.payloadTemplate && Object.keys(formData.payloadTemplate).length > 0) {
        // Process template variables for testing
        const processedTemplate = JSON.stringify(formData.payloadTemplate)
          .replace(/\{\{entity\.id\}\}/g, '12345')
          .replace(/\{\{entity\.name\}\}/g, 'Test Entity')
          .replace(/\{\{entity\.email\}\}/g, 'test@example.com')
          .replace(/\{\{entity\.customerId\}\}/g, '67890')
          .replace(/\{\{entity\.type\}\}/g, 'test_type')
          .replace(/\{\{entity\.scheduledDate\}\}/g, new Date().toISOString())
          .replace(/\{\{timestamp\}\}/g, new Date().toISOString())
          .replace(/\{\{operation\}\}/g, formData.operation)
          .replace(/\{\{now\}\}/g, new Date().toISOString());
        
        try {
          testPayload = {
            ...JSON.parse(processedTemplate),
            _test: true,
            _timestamp: new Date().toISOString()
          };
        } catch (e) {
          // If template parsing fails, use default test payload
          console.warn('Failed to parse payload template for testing', e);
        }
      }
      
      const result = await testWebhook({
        webhookUrl: formData.webhookUrl,
        headers: formData.headers,
        payload: testPayload
      });
      
      if (result) {
        setTestResult(result);
        if (!result.success) {
          setTestError(result.errorMessage || 'Webhook test failed');
        }
      }
    } catch (error: any) {
      setTestError(error.message || 'Test failed');
      setTestResult(null);
    }
  };

  const toggleShowHeaderValue = (key: string) => {
    setShowHeaderValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const payloadTemplateExamples: Record<AutomationEntityType, Record<string, string>> = {
    [AutomationEntityType.CUSTOMER]: {
      event: "customer.{{operation}}",
      customer_id: "{{entity.id}}",
      customer_name: "{{entity.name}}",
      customer_email: "{{entity.email}}",
      timestamp: "{{timestamp}}"
    },
    [AutomationEntityType.REQUEST]: {
      event: "request.{{operation}}",
      request_id: "{{entity.id}}",
      request_type: "{{entity.type}}",
      customer_id: "{{entity.customerId}}",
      timestamp: "{{timestamp}}"
    },
    [AutomationEntityType.APPOINTMENT]: {
      event: "appointment.{{operation}}",
      appointment_id: "{{entity.id}}",
      customer_id: "{{entity.customerId}}",
      scheduled_date: "{{entity.scheduledDate}}",
      timestamp: "{{timestamp}}"
    },
    [AutomationEntityType.USER]: {
      event: "user.{{operation}}",
      user_id: "{{entity.id}}",
      user_name: "{{entity.name}}",
      user_email: "{{entity.email}}",
      timestamp: "{{timestamp}}"
    }
  };

  const handleUseTemplate = () => {
    const template = payloadTemplateExamples[formData.entityType];
    if (template) {
      setFormData(prev => ({
        ...prev,
        payloadTemplate: template
      }));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {webhook ? 'Edit Webhook' : 'Create New Webhook'}
          </DialogTitle>
          <DialogDescription>
            Configure a webhook to trigger when specific events occur in the system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="payload">Payload</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Webhook"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="active">Active</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this webhook does..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL *</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://your-webhook-endpoint.com/webhook"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entityType">Entity Type *</Label>
                  <Select
                    value={formData.entityType}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      entityType: value as AutomationEntityType 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entityTypes.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operation">Operation *</Label>
                  <Select
                    value={formData.operation}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      operation: value as AutomationOperation 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operations.map((operation) => (
                        <SelectItem key={operation} value={operation} className="capitalize">
                          {operation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retryCount">Retry Count</Label>
                  <Input
                    id="retryCount"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.retryCount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      retryCount: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryDelaySeconds">Retry Delay (seconds)</Label>
                  <Input
                    id="retryDelaySeconds"
                    type="number"
                    min="1"
                    max="3600"
                    value={formData.retryDelaySeconds}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      retryDelaySeconds: parseInt(e.target.value) || 30 
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="headers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">HTTP Headers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Header */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={newHeaderKey}
                      onChange={(e) => setNewHeaderKey(e.target.value)}
                    />
                    <Input
                      placeholder="Header value"
                      value={newHeaderValue}
                      onChange={(e) => setNewHeaderValue(e.target.value)}
                    />
                    <Button type="button" onClick={handleAddHeader} disabled={!newHeaderKey || !newHeaderValue}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator />

                  {/* Existing Headers */}
                  <div className="space-y-2">
                    {Object.entries(formData.headers || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="outline">{key}</Badge>
                        <div className="flex-1 flex items-center gap-2">
                          <code className="flex-1 p-1 bg-muted rounded text-sm">
                            {showHeaderValues[key] ? value : '•'.repeat(value.length)}
                          </code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShowHeaderValue(key)}
                          >
                            {showHeaderValues[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(value)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveHeader(key)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {Object.keys(formData.headers || {}).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No headers configured
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payload" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Payload Template</CardTitle>
                  <Button type="button" variant="outline" onClick={handleUseTemplate}>
                    Use Template
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={JSON.stringify(formData.payloadTemplate, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData(prev => ({ ...prev, payloadTemplate: parsed }));
                      } catch (error) {
                        // Invalid JSON, keep the raw value for now
                      }
                    }}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="{}"
                  />
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Use template variables like <code>{'{{entity.id}}'}</code>, <code>{'{{entity.name}}'}</code>, 
                      <code>{'{{timestamp}}'}</code>, <code>{'{{operation}}'}</code> to dynamically populate data.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Webhook</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      The test will send a request to your webhook URL using your configured headers and a test payload based on your template.
                    </AlertDescription>
                  </Alert>

                  <Button type="button" onClick={handleTestWebhook} disabled={!formData.webhookUrl || loading}>
                    <TestTube className="w-4 h-4 mr-2" />
                    Send Test Request
                  </Button>

                  {testResult && testResult.success && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p><strong>Test successful!</strong></p>
                          <p>Response Status: <Badge variant="outline">{testResult.responseStatus || 200}</Badge></p>
                          <p>Execution Time: <Badge variant="outline">{testResult.executionTimeMs || testResult.responseTime}ms</Badge></p>
                          {testResult.serviceType && (
                            <p>Service Type: <Badge variant="outline">{testResult.serviceType}</Badge></p>
                          )}
                          {testResult.methodUsed && (
                            <p>Method Used: <Badge variant="outline">{testResult.methodUsed}</Badge></p>
                          )}
                          {testResult.validation?.recommendations && testResult.validation.recommendations.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Recommendations:</p>
                              <ul className="list-disc list-inside text-sm">
                                {testResult.validation.recommendations.map((rec: string, i: number) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {testResult.responseBody && testResult.responseBody.trim() && (
                            <details className="mt-2">
                              <summary className="cursor-pointer font-medium">Response Body</summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {testResult.responseBody}
                              </pre>
                            </details>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {(testError || (testResult && !testResult.success)) && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p><strong>Test failed:</strong></p>
                          <p>{testError || testResult?.errorMessage || 'Unknown error'}</p>
                          {testResult && (
                            <>
                              {testResult.responseStatus && (
                                <p>Response Status: <Badge variant="destructive">{testResult.responseStatus}</Badge></p>
                              )}
                              {testResult.validation?.errors && testResult.validation.errors.length > 0 && (
                                <div className="mt-2">
                                  <p className="font-medium">Validation Errors:</p>
                                  <ul className="list-disc list-inside text-sm">
                                    {testResult.validation.errors.map((err: string, i: number) => (
                                      <li key={i}>{err}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isSubmitting}>
              {isSubmitting ? 'Saving...' : (webhook ? 'Update Webhook' : 'Create Webhook')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
