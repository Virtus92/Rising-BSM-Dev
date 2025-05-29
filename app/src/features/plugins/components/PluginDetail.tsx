'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlugin } from '../hooks/usePlugin';
import { usePluginLicenses } from '../hooks/usePluginLicenses';
import { usePermissions } from '@/features/permissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Separator } from '@/shared/components/ui/separator';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { 
  Package, Download, Star, Shield, Code, Palette, Workflow, 
  Layers, Users, Calendar, TrendingUp, DollarSign, Clock, 
  CheckCircle, XCircle, AlertTriangle, Edit, Trash2, 
  ExternalLink, FileText, Lock, Key, Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Plugin type icons
const PluginTypeIcons = {
  ui: <Palette className="h-5 w-5" />,
  api: <Code className="h-5 w-5" />,
  automation: <Workflow className="h-5 w-5" />,
  mixed: <Layers className="h-5 w-5" />
};

// Status icons
const StatusIcons = {
  approved: <CheckCircle className="h-5 w-5 text-green-600" />,
  pending: <Clock className="h-5 w-5 text-yellow-600" />,
  rejected: <XCircle className="h-5 w-5 text-red-600" />,
  suspended: <AlertTriangle className="h-5 w-5 text-gray-600" />
};

interface PluginDetailProps {
  pluginId: number | string;
}

export const PluginDetail = ({ pluginId }: PluginDetailProps) => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  const {
    plugin,
    isLoading,
    error,
    stats,
    isLoadingStats,
    updatePlugin,
    isUpdatingPlugin,
    deletePlugin,
    isDeletingPlugin,
    approvePlugin,
    isApprovingPlugin,
    rejectPlugin,
    isRejectingPlugin,
    publishPlugin,
    isPublishingPlugin
  } = usePlugin(pluginId);
  
  const { licenses } = usePluginLicenses();
  
  // Permissions
  const canEdit = hasPermission(SystemPermission.PLUGIN_EDIT);
  const canDelete = hasPermission(SystemPermission.PLUGIN_DELETE);
  const canApprove = hasPermission(SystemPermission.PLUGIN_APPROVE);
  const canPublish = hasPermission(SystemPermission.PLUGIN_PUBLISH);
  const canInstall = hasPermission(SystemPermission.PLUGIN_INSTALL);
  const canManage = hasPermission(SystemPermission.PLUGIN_MANAGE);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error || !plugin) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Plugin not found
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The requested plugin could not be found.
        </p>
        <Button 
          onClick={() => router.push('/dashboard/plugins')} 
          variant="outline" 
          className="mt-4"
        >
          Back to Marketplace
        </Button>
      </div>
    );
  }
  
  const handleDelete = async () => {
    await deletePlugin();
    setShowDeleteDialog(false);
    router.push('/dashboard/plugins');
  };
  
  const handleReject = async () => {
    if (rejectReason.trim()) {
      await rejectPlugin(rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {plugin.icon && (
            <img 
              src={plugin.icon} 
              alt={plugin.displayName} 
              className="h-20 w-20 rounded-xl object-cover"
            />
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{plugin.displayName}</h1>
              {StatusIcons[plugin.status]}
            </div>
            <p className="text-muted-foreground mt-1">{plugin.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <Badge variant="outline" className="gap-1">
                {PluginTypeIcons[plugin.type]}
                {plugin.type}
              </Badge>
              <Badge variant="outline">{plugin.category}</Badge>
              <Badge variant="outline">v{plugin.version}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canInstall && plugin.status === 'approved' && (
            <Button 
              onClick={() => router.push(`/dashboard/plugins/${pluginId}/install`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          )}
          {canEdit && (
            <Button 
              variant="outline" 
              onClick={() => router.push(`/dashboard/plugins/${pluginId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canApprove && plugin.status === 'pending' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => approvePlugin()}
                disabled={isApprovingPlugin}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRejectDialog(true)}
                disabled={isRejectingPlugin}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {canPublish && plugin.status === 'approved' && (
            <Button 
              variant="outline" 
              onClick={() => publishPlugin()}
              disabled={isPublishingPlugin}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{plugin.downloads.toLocaleString()}</span>
              <Download className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{plugin.rating.toFixed(1)}</span>
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Installs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats?.activeInstalls || 0}</span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">${stats?.totalRevenue || 0}</span>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical Details</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          {canManage && <TabsTrigger value="licenses">Licenses</TabsTrigger>}
          {canManage && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About this Plugin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Author</h4>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{plugin.author}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Created</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(new Date(plugin.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Last Updated</h4>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(new Date(plugin.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
              
              {plugin.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {plugin.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {plugin.screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Screenshots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {plugin.screenshots.map((screenshot, index) => (
                    <img
                      key={index}
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      className="rounded-lg border"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">App Version Compatibility</h4>
                <p className="text-sm text-muted-foreground">
                  Minimum: v{plugin.minAppVersion}
                  {plugin.maxAppVersion && ` - Maximum: v${plugin.maxAppVersion}`}
                </p>
              </div>
              
              {plugin.dependencies.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Dependencies</h4>
                    <ul className="space-y-2">
                      {plugin.dependencies.map((dep, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-medium">{dep.pluginName}</span>
                          {dep.minVersion && ` (v${dep.minVersion}+)`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Security</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Digitally signed and verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-600" />
                    <span>Encrypted plugin bundle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-green-600" />
                    <span>License key required</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Permissions</CardTitle>
              <CardDescription>
                This plugin requires the following permissions to function
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plugin.permissions.length > 0 ? (
                <ul className="space-y-3">
                  {plugin.permissions.map((perm, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Badge 
                        variant={perm.required ? 'destructive' : 'secondary'}
                        className="mt-0.5"
                      >
                        {perm.required ? 'Required' : 'Optional'}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{perm.name}</p>
                        <p className="text-sm text-muted-foreground">{perm.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  This plugin does not require any special permissions.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Plans</CardTitle>
              <CardDescription>
                Choose the plan that best fits your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plugin.trialDays > 0 && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    🎉 {plugin.trialDays}-day free trial available
                  </p>
                </div>
              )}
              
              {Object.entries(plugin.pricing).length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(plugin.pricing).map(([tier, details]: [string, any]) => (
                    <Card key={tier} className="relative">
                      {details.popular && (
                        <Badge className="absolute -top-2 -right-2">Popular</Badge>
                      )}
                      <CardHeader>
                        <CardTitle className="capitalize">{tier}</CardTitle>
                        <CardDescription>
                          <span className="text-2xl font-bold">${details.price}</span>
                          {details.interval && <span>/{details.interval}</span>}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {details.features && (
                          <ul className="space-y-2 text-sm">
                            {details.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Free Plugin
                  </Badge>
                  <p className="mt-4 text-muted-foreground">
                    This plugin is free to use with no limitations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {canManage && (
          <TabsContent value="licenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>License Management</CardTitle>
                <CardDescription>
                  Manage licenses for this plugin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  License management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {canManage && (
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  View detailed analytics for this plugin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Analytics features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Plugin"
        description="Are you sure you want to delete this plugin? This action cannot be undone."
        itemName={plugin.displayName}
      />
      
      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Plugin</CardTitle>
              <CardDescription>
                Please provide a reason for rejecting this plugin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={4}
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleReject} 
                disabled={!rejectReason.trim() || isRejectingPlugin}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Plugin
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};