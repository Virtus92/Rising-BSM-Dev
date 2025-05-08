'use client';

import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  Settings, 
  RefreshCw, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useN8NSettings } from '../hooks/useN8NSettings';

/**
 * Header component for the N8N dashboard
 */
export const N8NDashboardHeader: React.FC = () => {
  const { 
    settings,
    loading,
    error,
    connectionStatus,
    testConnection,
    openSettingsModal
  } = useN8NSettings();
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">N8N Workflow Integration</h1>
          <p className="text-muted-foreground">
            Configure and manage automated workflows using n8n
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Connected</span>
            </div>
          ) : connectionStatus === 'error' ? (
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Connection Error</span>
            </div>
          ) : connectionStatus === 'not_configured' ? (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Not Configured</span>
            </div>
          ) : (
            <div className="flex items-center text-muted-foreground">
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              <span className="text-sm">Checking Connection</span>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={testConnection}
            disabled={loading || connectionStatus === 'checking' || !settings?.baseUrl}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
          
          <Button onClick={openSettingsModal}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20">
          {error}
        </div>
      )}
      
      {(!settings?.baseUrl || !settings?.apiKey) && (
        <div className="bg-amber-50 text-amber-800 text-sm p-2 rounded-md border border-amber-200">
          N8N integration is not fully configured. Please set up your connection settings.
        </div>
      )}
    </div>
  );
};
