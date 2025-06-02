'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { 
  Info, 
  AlertCircle,
  Copy,
  Eye,
  Code,
  Variable,
  Webhook,
  ChevronDown,
  Check,
  X,
  Plus,
  Trash,
  TestTube,
  Loader2,
  FileJson,
  Wand2
} from 'lucide-react';
import { useAutomation } from '../hooks/useAutomation';
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';
import { useToast } from '@/shared/hooks/useToast';

interface WebhookFormProps {
  webhook?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function WebhookForm({ webhook, onClose, onSuccess }: WebhookFormProps) {
  const { createWebhook, updateWebhook, testWebhook, loading } = useAutomation();
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    name: webhook?.name || '',
    description: webhook?.description || '',
    entityType: webhook?.entityType || AutomationEntityType.REQUEST,
    operation: webhook?.operation || AutomationOperation.CREATE,
    webhookUrl: webhook?.webhookUrl || '',
    headers: webhook?.headers || {},
    payloadTemplate: webhook?.payloadTemplate || {},
    active: webhook?.active !== false
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('basic');
  const [showVariables, setShowVariables] = useState(false);
  const [templatePreview, setTemplatePreview] = useState('');
  const [templateError, setTemplateError] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<any>(null);
  const [isLoadingVariables, setIsLoadingVariables] = useState(false);
  const [templateMode, setTemplateMode] = useState<'default' | 'custom'>('default');
  
  // Header management
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  // Operations available for each entity type
  const operationsByEntity = {
    [AutomationEntityType.USER]: [
      AutomationOperation.CREATE,
      AutomationOperation.UPDATE,
      AutomationOperation.DELETE,
      AutomationOperation.STATUS_CHANGED
    ],
    [AutomationEntityType.CUSTOMER]: [
      AutomationOperation.CREATE,
      AutomationOperation.UPDATE,
      AutomationOperation.DELETE,
      AutomationOperation.STATUS_CHANGED
    ],
    [AutomationEntityType.APPOINTMENT]: [
      AutomationOperation.CREATE,
      AutomationOperation.UPDATE,
      AutomationOperation.DELETE,
      AutomationOperation.STATUS_CHANGED,
      AutomationOperation.COMPLETED
    ],
    [AutomationEntityType.REQUEST]: [
      AutomationOperation.CREATE,
      AutomationOperation.UPDATE,
      AutomationOperation.DELETE,
      AutomationOperation.STATUS_CHANGED,
      AutomationOperation.ASSIGNED,
      AutomationOperation.COMPLETED
    ],
    [AutomationEntityType.PLUGIN]: [
      AutomationOperation.CREATE,
      AutomationOperation.UPDATE,
      AutomationOperation.DELETE,
      AutomationOperation.STATUS_CHANGED
    ]
  };

  // Load available variables when entity type changes
  useEffect(() => {
    loadAvailableVariables();
  }, [formData.entityType]);

  // Load default template when entity type or operation changes
  useEffect(() => {
    if (templateMode === 'default') {
      loadDefaultTemplate();
    }
  }, [formData.entityType, formData.operation, templateMode]);

  // Update preview when template changes
  useEffect(() => {
    updateTemplatePreview();
  }, [formData.payloadTemplate]);

  const loadAvailableVariables = async () => {
    try {
      setIsLoadingVariables(true);
      const response = await fetch(`/api/automation/webhooks/variables?entityType=${formData.entityType}`);
      const result = await response.json();
      
      if (result.success) {
        setAvailableVariables(result.data);
      }
    } catch (error) {
      console.error('Error loading variables:', error);
    } finally {
      setIsLoadingVariables(false);
    }
  };

  const loadDefaultTemplate = async () => {
    try {
      const response = await fetch(
        `/api/automation/webhooks/default-template?entityType=${formData.entityType}&operation=${formData.operation}`
      );
      const result = await response.json();
      
      if (result.success && result.data?.template) {
        setFormData(prev => ({
          ...prev,
          payloadTemplate: result.data.template
        }));
      }
    } catch (error) {
      console.error('Error loading default template:', error);
    }
  };

  const updateTemplatePreview = async () => {
    try {
      setTemplateError('');
      
      // Validate JSON
      const templateStr = getTemplateString();
      if (!templateStr.trim()) {
        setTemplatePreview('');
        return;
      }
      
      let parsedTemplate;
      try {
        parsedTemplate = JSON.parse(templateStr);
      } catch (e) {
        setTemplateError('Invalid JSON format');
        setTemplatePreview('');
        return;
      }
      
      // Get preview from API
      const response = await fetch('/api/automation/webhooks/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: parsedTemplate,
          entityType: formData.entityType,
          operation: formData.operation
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.preview) {
        setTemplatePreview(result.data.preview);
      } else {
        setTemplatePreview('// Unable to generate preview');
      }
    } catch (error) {
      console.error('Error updating preview:', error);
      setTemplatePreview('// Error generating preview');
    }
  };

  const getTemplateString = () => {
    if (typeof formData.payloadTemplate === 'string') {
      return formData.payloadTemplate;
    }
    return JSON.stringify(formData.payloadTemplate, null, 2);
  };

  const handleTemplateChange = (value: string) => {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(value);
      setFormData(prev => ({ ...prev, payloadTemplate: parsed }));
      setTemplateError('');
    } catch (e) {
      // If parsing fails, store as string temporarily
      setFormData(prev => ({ ...prev, payloadTemplate: value }));
      setTemplateError('Invalid JSON format');
    }
  };

  const addHeader = () => {
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

  const removeHeader = (key: string) => {
    setFormData(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const insertVariable = (variable: string) => {
    const template = getTemplateString();
    const cursorPosition = (document.getElementById('template-editor') as HTMLTextAreaElement)?.selectionStart || template.length;
    
    const before = template.substring(0, cursorPosition);
    const after = template.substring(cursorPosition);
    const newTemplate = `${before}{{${variable}}}${after}`;
    
    handleTemplateChange(newTemplate);
  };

  const handleTest = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      
      // Validate template JSON
      let parsedTemplate;
      try {
        parsedTemplate = typeof formData.payloadTemplate === 'string' 
          ? JSON.parse(formData.payloadTemplate) 
          : formData.payloadTemplate;
      } catch (e) {
        toast({
          title: 'Invalid Template',
          description: 'Please fix the JSON syntax errors in your template',
          variant: 'destructive'
        });
        return;
      }
      
      const result = await testWebhook({
        webhookUrl: formData.webhookUrl,
        headers: formData.headers,
        payload: parsedTemplate
      });
      
      setTestResult(result);
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      if (!formData.name || !formData.webhookUrl) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }
      
      // Validate template
      let parsedTemplate;
      try {
        parsedTemplate = typeof formData.payloadTemplate === 'string' 
          ? JSON.parse(formData.payloadTemplate) 
          : formData.payloadTemplate;
      } catch (e) {
        toast({
          title: 'Invalid Template',
          description: 'Please fix the JSON syntax errors in your template',
          variant: 'destructive'
        });
        return;
      }
      
      const data = {
        ...formData,
        payloadTemplate: parsedTemplate
      };
      
      if (webhook) {
        await updateWebhook(webhook.id.toString(), data);
      } else {
        await createWebhook(data);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{webhook ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
          <DialogDescription>
            Configure a webhook to send data when specific events occur
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="payload">Payload Template</TabsTrigger>
            <TabsTrigger value="headers">Headers & Test</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Send to Slack"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this webhook do?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entityType">Entity Type *</Label>
                  <Select
                    value={formData.entityType}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      entityType: value as AutomationEntityType,
                      operation: operationsByEntity[value as AutomationEntityType]?.[0] || AutomationOperation.CREATE
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AutomationEntityType).map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operation">Operation *</Label>
                  <Select
                    value={formData.operation as string}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      operation: value as AutomationOperation 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(operationsByEntity[formData.entityType as keyof typeof operationsByEntity] || []).map((op: AutomationOperation) => (
                        <SelectItem key={op} value={op}>
                          {op.charAt(0).toUpperCase() + op.slice(1).replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL *</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://example.com/webhook"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: !!checked }))}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active (webhook will trigger on events)
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="payload" className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <Label>Payload Template</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTemplateMode('default')}
                    className={templateMode === 'default' ? 'bg-accent' : ''}
                  >
                    <Wand2 className="w-4 h-4 mr-1" />
                    Use Default
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTemplateMode('custom')}
                    className={templateMode === 'custom' ? 'bg-accent' : ''}
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Custom
                  </Button>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Use <code className="text-sm bg-muted px-1 rounded">{`{{variable}}`}</code> syntax to insert dynamic values
                </AlertDescription>
              </Alert>

              <Collapsible open={showVariables} onOpenChange={setShowVariables}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center">
                      <Variable className="w-4 h-4 mr-2" />
                      Available Variables
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showVariables ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <Card>
                    <CardContent className="pt-4">
                      {isLoadingVariables ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : availableVariables ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Entity Variables</h4>
                            <div className="flex flex-wrap gap-2">
                              {availableVariables.entityVariables.map((variable: string) => (
                                <Badge
                                  key={variable}
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-accent"
                                  onClick={() => insertVariable(variable)}
                                >
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">System Variables</h4>
                            <div className="flex flex-wrap gap-2">
                              {availableVariables.systemVariables.map((variable: string) => (
                                <Badge
                                  key={variable}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-accent"
                                  onClick={() => insertVariable(variable)}
                                >
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Unable to load variables</p>
                      )}
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-editor">Template JSON</Label>
                  <Textarea
                    id="template-editor"
                    value={getTemplateString()}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    placeholder="Enter your JSON template..."
                    rows={15}
                    className={`font-mono text-sm ${templateError ? 'border-red-500' : ''}`}
                  />
                  {templateError && (
                    <p className="text-sm text-red-500">{templateError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Preview with Sample Data</Label>
                  <Card className="h-[360px]">
                    <ScrollArea className="h-full">
                      <pre className="p-4 text-sm">
                        {templatePreview || '// Preview will appear here'}
                      </pre>
                    </ScrollArea>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="headers" className="space-y-4">
              <div>
                <Label>Custom Headers</Label>
                <Card className="mt-2">
                  <CardContent className="pt-4 space-y-4">
                    {Object.entries(formData.headers).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Input value={key} disabled className="flex-1" />
                        <Input value={value as string} disabled className="flex-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHeader(key)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Header name"
                        value={newHeaderKey}
                        onChange={(e) => setNewHeaderKey(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Header value"
                        value={newHeaderValue}
                        onChange={(e) => setNewHeaderValue(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addHeader}
                        disabled={!newHeaderKey || !newHeaderValue}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label>Test Webhook</Label>
                <Card className="mt-2">
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Test your webhook configuration with sample data
                    </p>
                    
                    <Button
                      onClick={handleTest}
                      disabled={!formData.webhookUrl || isTesting}
                      className="w-full"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Test Webhook
                        </>
                      )}
                    </Button>

                    {testResult && (
                      <Alert variant={testResult.success ? 'default' : 'destructive'}>
                        <div className="flex items-start gap-2">
                          {testResult.success ? (
                            <Check className="w-4 h-4 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {testResult.success ? 'Test Successful' : 'Test Failed'}
                            </p>
                            {testResult.responseStatus && (
                              <p className="text-sm">
                                Status: {testResult.responseStatus}
                                {testResult.executionTimeMs && ` (${testResult.executionTimeMs}ms)`}
                              </p>
                            )}
                            {testResult.errorMessage && (
                              <p className="text-sm">{testResult.errorMessage}</p>
                            )}
                          </div>
                        </div>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {webhook ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              webhook ? 'Update Webhook' : 'Create Webhook'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
