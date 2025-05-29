'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePluginInstallations } from '../hooks/usePluginInstallations';
import { usePluginLicenses } from '../hooks/usePluginLicenses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { 
  Package, Settings, Trash2, PlayCircle, PauseCircle, 
  Activity, Clock, Key, HardDrive, TrendingUp, 
  AlertTriangle, CheckCircle, XCircle, RefreshCw 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/shared/utils/cn';

// Status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    case 'inactive':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    case 'uninstalled':
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  }
};

// Status icons
const StatusIcons = {
  active: <CheckCircle className="h-4 w-4" />,
  inactive: <PauseCircle className="h-4 w-4" />,
  uninstalled: <XCircle className="h-4 w-4" />
};

export const InstalledPlugins = () => {
  const router = useRouter();
  const [selectedInstallation, setSelectedInstallation] = useState<string | null>(null);
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);
  
  const {
    installations,
    isLoading,
    error,
    updateStatus,
    isUpdatingStatus,
    uninstallPlugin,
    isUninstallingPlugin,
    getExecutionHistory
  } = usePluginInstallations();
  
  const { licenses } = usePluginLicenses();
  
  const handleStatusToggle = useCallback(async (installationId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateStatus({ installationId, status: newStatus });
  }, [updateStatus]);
  
  const handleUninstall = useCallback(async () => {
    if (selectedInstallation) {
      await uninstallPlugin(selectedInstallation);
      setShowUninstallDialog(false);
      setSelectedInstallation(null);
    }
  }, [selectedInstallation, uninstallPlugin]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load installed plugins. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  const activeInstallations = installations.filter(i => i.status !== 'uninstalled');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Installed Plugins</h2>
          <p className="text-muted-foreground">
            Manage your installed plugins and their settings
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/plugins')}
          variant="outline"
        >
          <Package className="h-4 w-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Installed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{activeInstallations.length}</span>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Plugins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {activeInstallations.filter(i => i.status === 'active').length}
              </span>
              <PlayCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {licenses.filter(l => l.status === 'active').length}
              </span>
              <Key className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">0</span>
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Installed Plugins List */}
      {activeInstallations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No plugins installed</h3>
            <p className="text-muted-foreground text-center mt-2 max-w-sm">
              Browse the marketplace to find and install plugins that extend your application's functionality.
            </p>
            <Button 
              onClick={() => router.push('/dashboard/plugins')}
              className="mt-4 bg-purple-600 hover:bg-purple-700"
            >
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeInstallations.map((installation) => {
            const license = licenses.find(l => l.id === installation.licenseId);
            
            return (
              <Card key={installation.id} className="relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 left-0 w-full h-1",
                  installation.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'
                )} />
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Plugin #{installation.pluginId}
                      </CardTitle>
                      <CardDescription>
                        v{installation.version}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(installation.status)}>
                      {StatusIcons[installation.status as keyof typeof StatusIcons]}
                      <span className="ml-1">{installation.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Installed</span>
                      <span>{formatDistanceToNow(new Date(installation.installedAt), { addSuffix: true })}</span>
                    </div>
                    
                    {installation.lastHeartbeat && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last Active</span>
                        <span>{formatDistanceToNow(new Date(installation.lastHeartbeat), { addSuffix: true })}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">License Type</span>
                      <Badge variant="outline" className="text-xs">
                        {license?.type || 'Unknown'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Installation ID</span>
                      <code className="text-xs font-mono">{installation.installationId.slice(0, 8)}...</code>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={installation.status === 'active'}
                        onCheckedChange={() => handleStatusToggle(installation.installationId, installation.status)}
                        disabled={isUpdatingStatus}
                      />
                      <Label className="text-sm">Active</Label>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/plugins/${installation.pluginId}`)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInstallation(installation.installationId);
                          setShowUninstallDialog(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Uninstall Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showUninstallDialog}
        onCancel={() => {
          setShowUninstallDialog(false);
          setSelectedInstallation(null);
        }}
        onConfirm={handleUninstall}
        title="Uninstall Plugin"
        description="Are you sure you want to uninstall this plugin? You can reinstall it later using your license key."
        itemName="this plugin"
      />
    </div>
  );
};