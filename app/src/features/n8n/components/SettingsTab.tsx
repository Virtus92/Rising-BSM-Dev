'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/shared/components/ui/card';
import { 
  Save, 
  RefreshCw, 
  Lock,
  ServerCrash,
  ChevronDownIcon,
  ChevronRight
} from 'lucide-react';
import { useN8NSettings } from '../hooks/useN8NSettings';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

/**
 * Settings tab component for N8N integration
 */
export const SettingsTab: React.FC = () => {
  const { 
    settings, 
    loading, 
    error,
    testConnection,
    saveSettings,
    resetDefaults
  } = useN8NSettings();
  
  const [formValues, setFormValues] = useState({
    baseUrl: settings?.baseUrl || '',
    apiKey: settings?.apiKey || '',
    enabled: settings?.enabled ?? true,
    autoDiscover: settings?.advanced?.autoDiscover ?? false,
    webhooksEnabled: settings?.advanced?.webhooksEnabled ?? true,
    debugMode: settings?.advanced?.debugMode ?? false
  });
  
  const handleChange = (field: string, value: string | boolean) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleAdvancedChange = (field: string, value: boolean) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings({
      baseUrl: formValues.baseUrl,
      apiKey: formValues.apiKey,
      enabled: formValues.enabled,
      advanced: {
        autoDiscover: formValues.autoDiscover,
        webhooksEnabled: formValues.webhooksEnabled,
        debugMode: formValues.debugMode
      }
    });
  };
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-0.5">
        <h2 className="text-xl font-bold tracking-tight">Connection Settings</h2>
        <p className="text-muted-foreground">
          Configure your connection to the n8n workflow automation server
        </p>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20">
          <div className="flex items-start">
            <ServerCrash className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>N8N Server Connection</CardTitle>
            <CardDescription>
              Enter the URL and API key for your n8n server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="n8n-url">Base URL</Label>
              <Input
                id="n8n-url"
                type="url"
                placeholder="https://n8n.example.com"
                value={formValues.baseUrl}
                onChange={(e) => handleChange('baseUrl', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                The base URL of your n8n server (e.g., https://n8n.example.com)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="n8n-api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="n8n-api-key"
                  type="password"
                  placeholder="Enter your n8n API key"
                  value={formValues.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  required
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Your n8n API key for authentication. You can generate this in your n8n instance.
              </p>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="n8n-enabled"
                checked={formValues.enabled}
                onCheckedChange={(value) => handleChange('enabled', value)}
              />
              <Label htmlFor="n8n-enabled">Enable N8N Integration</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={resetDefaults}
            >
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={testConnection}
                disabled={loading || !formValues.baseUrl || !formValues.apiKey}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="advanced-settings">
            <AccordionTrigger>
              <span className="text-base font-medium">Advanced Settings</span>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-discover">Automatic API Discovery</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically discover API endpoints from your application
                      </p>
                    </div>
                    <Switch
                      id="auto-discover"
                      checked={formValues.autoDiscover}
                      onCheckedChange={(value) => handleAdvancedChange('autoDiscover', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="webhooks-enabled">Enable Webhooks</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow n8n to send data to your application via webhooks
                      </p>
                    </div>
                    <Switch
                      id="webhooks-enabled"
                      checked={formValues.webhooksEnabled}
                      onCheckedChange={(value) => handleAdvancedChange('webhooksEnabled', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="debug-mode">Debug Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable more detailed logging for troubleshooting
                      </p>
                    </div>
                    <Switch
                      id="debug-mode"
                      checked={formValues.debugMode}
                      onCheckedChange={(value) => handleAdvancedChange('debugMode', value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>
    </div>
  );
};
