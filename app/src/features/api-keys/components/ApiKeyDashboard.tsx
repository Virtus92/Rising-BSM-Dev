'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { 
  Key, 
  Plus, 
  Shield, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useApiKeys } from '../hooks/useApiKeys';
import { ApiKeyList } from './ApiKeyList';
import { ApiKeyForm } from './ApiKeyForm';
import { ApiKeyStats } from './ApiKeyStats';
import ApiKeyPermissionsDebugger from '../utils/ApiKeyPermissionsDebugger';

export function ApiKeyDashboard() {
  const { 
    apiKeys, 
    stats,
    loading, 
    error, 
    fetchApiKeys,
    fetchStats
  } = useApiKeys();

  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Load data on mount
    const loadData = async () => {
      setIsInitializing(true);
      try {
        await Promise.all([
          fetchApiKeys(),
          fetchStats()
        ]);
        
        // Debug API keys after loading
        console.log('🔍 API Keys Dashboard: Data loaded, debugging...');
        ApiKeyPermissionsDebugger.debugApiKeysList(apiKeys, 'Dashboard Load');
      } catch (error) {
        console.error('Error loading API key data:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    loadData();
  }, [fetchApiKeys, fetchStats]);
  
  // Debug API keys whenever they change
  useEffect(() => {
    if (apiKeys.length > 0) {
      ApiKeyPermissionsDebugger.debugApiKeysList(apiKeys, 'API Keys State Update');
    }
  }, [apiKeys]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchApiKeys();
    fetchStats();
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading API key data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Key Management</h1>
          <p className="text-muted-foreground">
            Manage API keys and control programmatic access to your system
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKeys || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                {stats?.activeKeys || 0} active
              </div>
              <div className="flex items-center">
                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                {stats?.revokedKeys || 0} revoked
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Keys</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.adminKeys || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.standardKeys || 0} standard keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsage || 0}</div>
            <p className="text-xs text-muted-foreground">
              API calls made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiringSoonKeys || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.expiredKeys || 0} already expired
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for Expiring Keys */}
      {stats && stats.expiringSoonKeys > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Keys Expiring Soon
            </CardTitle>
            <CardDescription className="text-orange-700">
              You have {stats.expiringSoonKeys} API key(s) expiring within the next 7 days
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Keys */}
            <Card>
              <CardHeader>
                <CardTitle>Recently Used Keys</CardTitle>
                <CardDescription>API keys that have been used recently</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentlyUsed && stats.recentlyUsed.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentlyUsed.slice(0, 5).map((key) => (
                      <div key={key.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {key.type}
                          </Badge>
                          <span className="text-sm font-medium">{key.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {key.usageCount} uses
                          </span>
                          {key.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recently used keys</p>
                )}
              </CardContent>
            </Card>

            {/* Unused Keys */}
            <Card>
              <CardHeader>
                <CardTitle>Unused Keys</CardTitle>
                <CardDescription>API keys that haven't been used recently</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.unusedKeys && stats.unusedKeys.length > 0 ? (
                  <div className="space-y-3">
                    {stats.unusedKeys.slice(0, 5).map((key) => (
                      <div key={key.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {key.type}
                          </Badge>
                          <span className="text-sm font-medium">{key.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(key.createdAt).toLocaleDateString()}
                          </span>
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">All keys are being used</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keys">
          <ApiKeyList 
            apiKeys={apiKeys}
            onRefresh={fetchApiKeys}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <ApiKeyStats stats={stats} />
        </TabsContent>
      </Tabs>

      {/* Create Form */}
      {showCreateForm && (
        <ApiKeyForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
