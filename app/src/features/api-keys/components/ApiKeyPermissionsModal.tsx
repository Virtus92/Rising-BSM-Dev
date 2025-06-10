'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Separator } from '@/shared/components/ui/separator';
import { 
  Shield, 
  Key, 
  Search, 
  CheckCircle, 
  XCircle, 
  Users, 
  Settings, 
  Calendar, 
  Bell,
  Database,
  Cog,
  Activity,
  Lock
} from 'lucide-react';
import { ApiKeyResponseDto, UpdateApiKeyPermissionsDto } from '@/domain/dtos/ApiKeyDtos';
import { ApiKeyType } from '@/domain/entities/ApiKey';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { useApiKeys } from '../hooks/useApiKeys';
import { useToast } from '@/shared/hooks/useToast';

interface ApiKeyPermissionsModalProps {
  apiKey: ApiKeyResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  dashboard: {
    name: 'Dashboard',
    icon: Activity,
    description: 'Dashboard access and viewing',
    permissions: [SystemPermission.DASHBOARD_ACCESS]
  },
  users: {
    name: 'User Management',
    icon: Users,
    description: 'User account management and administration',
    permissions: [
      SystemPermission.USERS_VIEW,
      SystemPermission.USERS_CREATE,
      SystemPermission.USERS_EDIT,
      SystemPermission.USERS_DELETE
    ]
  },
  customers: {
    name: 'Customer Management',
    icon: Users,
    description: 'Customer data and relationship management',
    permissions: [
      SystemPermission.CUSTOMERS_VIEW,
      SystemPermission.CUSTOMERS_CREATE,
      SystemPermission.CUSTOMERS_EDIT,
      SystemPermission.CUSTOMERS_DELETE
    ]
  },
  requests: {
    name: 'Request Management',
    icon: Database,
    description: 'Service requests and workflow management',
    permissions: [
      SystemPermission.REQUESTS_VIEW,
      SystemPermission.REQUESTS_CREATE,
      SystemPermission.REQUESTS_EDIT,
      SystemPermission.REQUESTS_DELETE,
      SystemPermission.REQUESTS_APPROVE,
      SystemPermission.REQUESTS_REJECT,
      SystemPermission.REQUESTS_ASSIGN,
      SystemPermission.REQUESTS_CONVERT
    ]
  },
  appointments: {
    name: 'Appointment Management',
    icon: Calendar,
    description: 'Appointment scheduling and management',
    permissions: [
      SystemPermission.APPOINTMENTS_VIEW,
      SystemPermission.APPOINTMENTS_CREATE,
      SystemPermission.APPOINTMENTS_EDIT,
      SystemPermission.APPOINTMENTS_DELETE
    ]
  },
  notifications: {
    name: 'Notifications',
    icon: Bell,
    description: 'Notification management',
    permissions: [SystemPermission.NOTIFICATIONS_VIEW]
  },
  settings: {
    name: 'Settings',
    icon: Settings,
    description: 'System configuration and settings',
    permissions: [
      SystemPermission.SETTINGS_VIEW,
      SystemPermission.SETTINGS_EDIT,
      SystemPermission.PROFILE_VIEW,
      SystemPermission.PROFILE_EDIT
    ]
  },
  permissions: {
    name: 'Permission Management',
    icon: Lock,
    description: 'User permissions and access control',
    permissions: [
      SystemPermission.PERMISSIONS_VIEW,
      SystemPermission.PERMISSIONS_MANAGE
    ]
  },
  automation: {
    name: 'Automation',
    icon: Cog,
    description: 'Automation and workflow management',
    permissions: [
      SystemPermission.AUTOMATION_VIEW,
      SystemPermission.AUTOMATION_CREATE,
      SystemPermission.AUTOMATION_EDIT,
      SystemPermission.AUTOMATION_DELETE,
      SystemPermission.AUTOMATION_MANAGE
    ]
  },
  apiKeys: {
    name: 'API Key Management',
    icon: Key,
    description: 'API key management and administration',
    permissions: [
      SystemPermission.API_KEYS_VIEW,
      SystemPermission.API_KEYS_CREATE,
      SystemPermission.API_KEYS_EDIT,
      SystemPermission.API_KEYS_DELETE,
      SystemPermission.API_KEYS_MANAGE
    ]
  },
  system: {
    name: 'System Administration',
    icon: Shield,
    description: 'Full system administration access',
    permissions: [SystemPermission.SYSTEM_ADMIN]
  }
};

export function ApiKeyPermissionsModal({ apiKey, onClose, onSuccess }: ApiKeyPermissionsModalProps) {
  // CRITICAL: All hooks MUST be called unconditionally, before any early returns
  const { updateApiKeyPermissions, loading } = useApiKeys();
  const { toast } = useToast();
  
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('categories');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize selected permissions when apiKey prop changes
  useEffect(() => {
    if (apiKey && apiKey.permissions) {
      console.log('Initializing permissions for API key:', apiKey.name, 'with permissions:', apiKey.permissions);
      const permissions = new Set(apiKey.permissions);
      setSelectedPermissions(permissions);
    } else if (apiKey) {
      console.log('API key has no permissions:', apiKey.name, 'apiKey.permissions:', apiKey.permissions);
      setSelectedPermissions(new Set());
    }
  }, [apiKey]);

  // Track changes
  useEffect(() => {
    if (apiKey) {
      const originalPermissions = new Set(apiKey.permissions || []);
      const hasChanges = originalPermissions.size !== selectedPermissions.size ||
                        ![...originalPermissions].every(p => selectedPermissions.has(p));
      setHasChanges(hasChanges);
    }
  }, [selectedPermissions, apiKey]);

  // Filter permissions by search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return Object.values(SystemPermission);
    
    const query = searchQuery.toLowerCase();
    return Object.values(SystemPermission).filter(permission =>
      permission.toLowerCase().includes(query) ||
      formatPermissionLabel(permission).toLowerCase().includes(query) ||
      getPermissionDescription(permission).toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // NOW we can do early returns after all hooks have been called
  if (!apiKey) return null;

  // Don't show for admin keys
  if (apiKey.type === ApiKeyType.ADMIN) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span>Manage Permissions</span>
            </DialogTitle>
          </DialogHeader>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Admin keys have full access to all system functionality. 
              Permissions cannot be modified for admin keys.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async () => {
    try {
      console.log('Updating permissions for API key:', apiKey.id, 'with permissions:', Array.from(selectedPermissions));
      
      const updateData: UpdateApiKeyPermissionsDto = {
        apiKeyId: apiKey.id,
        permissions: Array.from(selectedPermissions)
      };

      await updateApiKeyPermissions(updateData);
      
      toast({
        title: 'Success',
        description: `Permissions for "${apiKey.name}" have been updated successfully`
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: 'Error',
        description: `Failed to update permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newSelected = new Set(selectedPermissions);
    if (checked) {
      newSelected.add(permission);
    } else {
      newSelected.delete(permission);
    }
    setSelectedPermissions(newSelected);
  };

  const handleCategoryToggle = (categoryPermissions: string[], allSelected: boolean) => {
    const newSelected = new Set(selectedPermissions);
    
    if (allSelected) {
      // Remove all permissions in this category
      categoryPermissions.forEach(permission => newSelected.delete(permission));
    } else {
      // Add all permissions in this category
      categoryPermissions.forEach(permission => newSelected.add(permission));
    }
    
    setSelectedPermissions(newSelected);
  };

  const formatPermissionLabel = (permission: string) => {
    return permission
      .replace(/_/g, ' ')
      .replace(/\./g, ': ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPermissionDescription = (permission: string) => {
    const descriptions: Record<string, string> = {
      [SystemPermission.DASHBOARD_ACCESS]: 'View the main dashboard',
      [SystemPermission.USERS_VIEW]: 'View user accounts and profiles',
      [SystemPermission.USERS_CREATE]: 'Create new user accounts',
      [SystemPermission.USERS_EDIT]: 'Edit existing user accounts',
      [SystemPermission.USERS_DELETE]: 'Delete user accounts',
      [SystemPermission.CUSTOMERS_VIEW]: 'View customer information',
      [SystemPermission.CUSTOMERS_CREATE]: 'Create new customer records',
      [SystemPermission.CUSTOMERS_EDIT]: 'Edit customer information',
      [SystemPermission.CUSTOMERS_DELETE]: 'Delete customer records',
      [SystemPermission.REQUESTS_VIEW]: 'View service requests',
      [SystemPermission.REQUESTS_CREATE]: 'Create new service requests',
      [SystemPermission.REQUESTS_EDIT]: 'Edit service requests',
      [SystemPermission.REQUESTS_DELETE]: 'Delete service requests',
      [SystemPermission.REQUESTS_APPROVE]: 'Approve service requests',
      [SystemPermission.REQUESTS_REJECT]: 'Reject service requests',
      [SystemPermission.REQUESTS_ASSIGN]: 'Assign requests to users',
      [SystemPermission.REQUESTS_CONVERT]: 'Convert requests to customers/appointments',
      [SystemPermission.APPOINTMENTS_VIEW]: 'View appointments',
      [SystemPermission.APPOINTMENTS_CREATE]: 'Create new appointments',
      [SystemPermission.APPOINTMENTS_EDIT]: 'Edit appointments',
      [SystemPermission.APPOINTMENTS_DELETE]: 'Delete appointments',
      [SystemPermission.NOTIFICATIONS_VIEW]: 'View and manage notifications',
      [SystemPermission.SETTINGS_VIEW]: 'View system settings',
      [SystemPermission.SETTINGS_EDIT]: 'Edit system settings',
      [SystemPermission.PROFILE_VIEW]: 'View user profile',
      [SystemPermission.PROFILE_EDIT]: 'Edit user profile',
      [SystemPermission.PERMISSIONS_VIEW]: 'View permission assignments',
      [SystemPermission.PERMISSIONS_MANAGE]: 'Manage user permissions',
      [SystemPermission.AUTOMATION_VIEW]: 'View automation workflows',
      [SystemPermission.AUTOMATION_CREATE]: 'Create automation workflows',
      [SystemPermission.AUTOMATION_EDIT]: 'Edit automation workflows',
      [SystemPermission.AUTOMATION_DELETE]: 'Delete automation workflows',
      [SystemPermission.AUTOMATION_MANAGE]: 'Manage automation system',
      [SystemPermission.API_KEYS_VIEW]: 'View API keys',
      [SystemPermission.API_KEYS_CREATE]: 'Create new API keys',
      [SystemPermission.API_KEYS_EDIT]: 'Edit existing API keys',
      [SystemPermission.API_KEYS_DELETE]: 'Delete API keys',
      [SystemPermission.API_KEYS_MANAGE]: 'Manage API key system',
      [SystemPermission.SYSTEM_ADMIN]: 'Full system administration access'
    };
    return descriptions[permission] || 'Permission access';
  };

  const selectedCount = selectedPermissions.size;
  const totalPermissions = Object.values(SystemPermission).length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <span>Manage Permissions</span>
            <Badge variant="outline">{apiKey.name}</Badge>
          </DialogTitle>
          <DialogDescription>
            Configure which permissions this API key should have. 
            Currently {selectedCount} of {totalPermissions} permissions selected.
            {apiKey.permissions && (
              <div className="mt-2 text-sm text-muted-foreground">
                <strong>Debug:</strong> API key has {apiKey.permissions.length} permissions loaded: {apiKey.permissions.join(', ')}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Debug Information */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-800">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-700">
              <div><strong>API Key ID:</strong> {apiKey.id}</div>
              <div><strong>API Key Type:</strong> {apiKey.type}</div>
              <div><strong>Permissions from API:</strong> {apiKey.permissions ? JSON.stringify(apiKey.permissions) : 'null/undefined'}</div>
              <div><strong>Selected Count:</strong> {selectedCount}</div>
              <div><strong>Has Changes:</strong> {hasChanges ? 'Yes' : 'No'}</div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {selectedCount} permissions selected
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPermissions(new Set(Object.values(SystemPermission)))}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPermissions(new Set())}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="space-y-2">
            <Label>Search Permissions</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Permission Organization */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="list">All Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                const categoryPermissions = category.permissions.filter(p => 
                  !searchQuery || filteredPermissions.includes(p)
                );
                
                if (categoryPermissions.length === 0) return null;

                const selectedInCategory = categoryPermissions.filter(p => selectedPermissions.has(p)).length;
                const allSelected = selectedInCategory === categoryPermissions.length;
                const someSelected = selectedInCategory > 0 && selectedInCategory < categoryPermissions.length;

                return (
                  <Card key={key}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <category.icon className="w-4 h-4" />
                          <div>
                            <CardTitle className="text-sm">{category.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {category.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {selectedInCategory}/{categoryPermissions.length}
                          </Badge>
                          <Checkbox
                            checked={allSelected}
                            ref={(ref) => {
                              if (ref && 'indeterminate' in ref) {
                                (ref as any).indeterminate = someSelected;
                              }
                            }}
                            onCheckedChange={() => handleCategoryToggle(categoryPermissions, allSelected)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {categoryPermissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-3 p-2 rounded border hover:bg-muted/50">
                          <Checkbox
                            id={permission}
                            checked={selectedPermissions.has(permission)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor={permission} className="text-sm font-medium cursor-pointer">
                              {formatPermissionLabel(permission)}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {getPermissionDescription(permission)}
                            </p>
                            <code className="text-xs text-muted-foreground font-mono">
                              {permission}
                            </code>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">All Permissions</CardTitle>
                  <CardDescription>
                    {filteredPermissions.length} permission(s) 
                    {searchQuery && ` matching "${searchQuery}"`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPermissions.map((permission) => (
                    <div key={permission} className="flex items-center space-x-3 p-2 rounded border hover:bg-muted/50">
                      <Checkbox
                        id={`list-${permission}`}
                        checked={selectedPermissions.has(permission)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <Label htmlFor={`list-${permission}`} className="text-sm font-medium cursor-pointer">
                          {formatPermissionLabel(permission)}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {getPermissionDescription(permission)}
                        </p>
                        <code className="text-xs text-muted-foreground font-mono">
                          {permission}
                        </code>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Selected Permissions Summary */}
          {selectedPermissions.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Permissions ({selectedPermissions.size})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {Array.from(selectedPermissions).map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {formatPermissionLabel(permission)}
                      <button
                        type="button"
                        onClick={() => handlePermissionChange(permission, false)}
                        className="ml-1 hover:text-red-600"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !hasChanges}
          >
            {loading ? 'Updating...' : 'Update Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
