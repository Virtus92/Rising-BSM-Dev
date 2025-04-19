'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Loader2, Save, Lock, Info, Filter, CheckCircle, User, AlertTriangle } from 'lucide-react';
import { UserRole } from '@/domain/enums/UserEnums';
import { Separator } from '@/shared/components/ui/separator';
import { Badge } from '@/shared/components/ui/badge';
import { UserDto } from '@/domain/dtos/UserDtos';
import { PermissionClient } from '@/infrastructure/api/PermissionClient';
import { SystemPermission, getPermissionsForRole } from '@/domain/enums/PermissionEnums';
import { SystemPermissionMap, createPermissionDefinitionList } from '@/domain/permissions/SystemPermissionMap';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { getRoleInfo } from '@/shared/components/permissions/RoleConfig';
import { Input } from '@/shared/components/ui/input';
import * as Icons from 'lucide-react';
import { getIconComponent } from '@/shared/utils/icon-utils';
import { 
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/shared/components/ui/alert";

// Define permission types with enhanced display info
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Using centralized permission definitions from SystemPermissionMap
 * This ensures consistency between backend and frontend
 */

/**
 * Creates formatted permissions list from system permissions enum and raw permission codes
 * 
 * @param permissionCodes - Raw permission codes from the API
 * @returns Formatted permissions list with display information
 */
const createPermissionsList = (permissionCodes: string[]): Permission[] => {
  // Use the centralized utility function
  const definitions = createPermissionDefinitionList(permissionCodes);
  
  // Map to our component's Permission interface
  const permissions = definitions.map(def => ({
    id: def.code.toString(),
    name: def.name,
    description: def.description,
    category: def.category
  }));
  
  // Sort permissions by category and then by name
  return permissions.sort((a, b) => {
    if (a.category === b.category) {
      return a.name.localeCompare(b.name);
    }
    return a.category.localeCompare(b.category);
  });
};

interface UserPermissionsProps {
  user: UserDto;
  onSave: (permissions: string[]) => Promise<void>;
  onCancel: () => void;
  readOnly?: boolean;
}

export const UserPermissions: React.FC<UserPermissionsProps> = ({
  user,
  onSave,
  onCancel,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [filterText, setFilterText] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all permissions first to get the full list of available permissions
  const fetchAvailablePermissions = async () => {
    try {
      // First try to get all permissions from the system
      const allPermsResponse = await PermissionClient.getPermissions({
        limit: 100 // Get a large number to ensure we get all
      });
      
      if (allPermsResponse.success && allPermsResponse.data && Array.isArray(allPermsResponse.data.data)) {
        // Extract all permission codes
        const permissionCodes = allPermsResponse.data.data.map((p: any) => p.code);
        return permissionCodes;
      }
      
      // Fallback to using enum values if API fails
      return Object.values(SystemPermission);
    } catch (err) {
      console.error('Error fetching available permissions:', err instanceof Error ? err.message : String(err));
      // Fallback to enum values if API fails
      return Object.values(SystemPermission);
    }
  };

  // Get role permissions
  const fetchRolePermissions = async (role: string) => {
    try {
      // Try API call first
      const response = await PermissionClient.getDefaultPermissionsForRole(role);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Fallback to local permissions if API fails
      return getPermissionsForRole(role);
    } catch (error) {
      // Fallback to local list
      return getPermissionsForRole(role);
    }
  };
  
  // Fetch user permissions on component mount
  useEffect(() => {
    let isMounted = true; // For avoiding state updates after unmount
    
    const fetchUserPermissions = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        setError(null);
        
        // Get all available permissions first
        const allPermissionCodes = await fetchAvailablePermissions();
        
        if (!isMounted) return;
        
        // Get role permissions
        const roleBased = await fetchRolePermissions(user.role);
        setRolePermissions(roleBased);
        
        // Fetch user-specific permissions from the API
        const response = await PermissionClient.getUserPermissions(user.id);
        
        if (!isMounted) return;
        
        let userPermissions: string[] = [];
        
        if (response.success && response.data && Array.isArray(response.data.permissions)) {
          userPermissions = response.data.permissions;
        } else {
          setError(response.message || 'Failed to retrieve user permissions');
          
          // Set default permissions based on role as fallback
          userPermissions = roleBased;
        }
        
        setSelectedPermissions(userPermissions);
        
        // Create the formatted permissions list using all available permission codes
        setAvailablePermissions(createPermissionsList(allPermissionCodes));
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading user permissions:', err instanceof Error ? err.message : String(err));
        setError('Failed to load user permissions. Please try again.');
        // Ensure we always set an array in case of error
        setSelectedPermissions([]);
        setAvailablePermissions(createPermissionsList(Object.values(SystemPermission)));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserPermissions();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user.id, user.role]);
  
  // Filter and group permissions
  const filteredPermissions = React.useMemo(() => {
    let filtered = availablePermissions;
    // Ensure rolePermissions is always treated as an array
    const safeRolePermissions = Array.isArray(rolePermissions) ? rolePermissions : [];
    
    // Filter by search text
    if (filterText) {
      const search = filterText.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.description.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        p.id.toLowerCase().includes(search)
      );
    }
    
    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'role') {
        // Role tab shows only permissions granted by the user's role
        filtered = filtered.filter(p => safeRolePermissions.includes(p.id));
      } else if (activeTab === 'individual') {
        filtered = filtered.filter(p => 
          selectedPermissions.includes(p.id) && !safeRolePermissions.includes(p.id)
        );
      } else if (activeTab === 'effective') {
        filtered = filtered.filter(p => selectedPermissions.includes(p.id));
      } else {
        filtered = filtered.filter(p => p.category.toLowerCase() === activeTab.toLowerCase());
      }
    }
    
    return filtered;
  }, [availablePermissions, filterText, activeTab, selectedPermissions, rolePermissions]);
  
  // Group filtered permissions by category
  const groupedPermissions: Record<string, Permission[]> = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Check if a permission is granted by the user's role
  const isRolePermission = (permissionId: string): boolean => {
    const safeRolePermissions = Array.isArray(rolePermissions) ? rolePermissions : [];
    return safeRolePermissions.includes(permissionId);
  };

  const handleTogglePermission = (permissionId: string) => {
    if (readOnly) return;
    
    // Can't toggle role-based permissions
    if (isRolePermission(permissionId)) return;

    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSave = async () => {
    if (readOnly) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(selectedPermissions);
      
      // After saving, refresh the permissions to ensure we're in sync with the backend
      const response = await PermissionClient.getUserPermissions(user.id);
      
      if (response.success && response.data && Array.isArray(response.data.permissions)) {
        setSelectedPermissions(response.data.permissions);
      }
    } catch (err) {
      console.error('Error saving permissions:', err instanceof Error ? err.message : String(err));
      setError('Failed to save permissions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleApplyRolePreset = async (role: UserRole) => {
    if (readOnly) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch default permissions for the role
      const rolePermsResponse = await fetchRolePermissions(role);
      
      // Ensure rolePerms is always treated as an array
      const rolePerms = Array.isArray(rolePermsResponse) ? rolePermsResponse : [];
      
      // Get the user's existing individual permissions (not from role)
      // Ensure rolePermissions is always treated as an array
      const safeRolePermissions = Array.isArray(rolePermissions) ? rolePermissions : [];
      const individualPerms = selectedPermissions.filter(p => !safeRolePermissions.includes(p));
      
      // Combine role permissions with individual permissions
      const newPerms = [...new Set([...rolePerms, ...individualPerms])];
      
      setSelectedPermissions(newPerms);
    } catch (err) {
      console.error('Error loading role permissions:', err);
      setError('Failed to load role permissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create tab list from unique categories plus special tabs
  const categories = [...new Set(availablePermissions.map(p => p.category))].sort();
  
  // Count of permissions by type
  const roleCount = rolePermissions.length;
  // Ensure rolePermissions is always treated as an array for individualCount calculation
  const safeRolePermissions = Array.isArray(rolePermissions) ? rolePermissions : [];
  const individualCount = selectedPermissions.filter(p => !safeRolePermissions.includes(p)).length;
  const effectiveCount = selectedPermissions.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">User Permissions</CardTitle>
            <CardDescription>
              {readOnly 
                ? `View permissions for ${user.name}`
                : `Manage permissions for ${user.name}`}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {/* Display user's role with badge */}
            <span className="text-sm text-muted-foreground">Role:</span>
            <RoleBadge role={user.role} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Notification about permissions feature being under development */}
        <Alert variant="success" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Permissions System Active</AlertTitle>
          <AlertDescription>
            Manage user permissions by selecting the permissions you want to grant. Role-based permissions are automatically applied based on the user's role.
          </AlertDescription>
        </Alert>
        
        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
            {error}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mb-4">
          <p className="text-sm text-muted-foreground mr-2 mt-1">Quick select:</p>
          {Object.entries(UserRole).map(([key, role]) => (
            <Button
              key={key}
              variant={user.role === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleApplyRolePreset(role)}
              disabled={readOnly || isLoading}
              className={user.role === role ? 'border-2 border-primary' : ''}
            >
              {getRoleInfo(role).label} preset
            </Button>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div className="flex flex-1 items-center space-x-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Filter permissions..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {readOnly && (
            <div className="flex items-center p-3 bg-blue-50 text-blue-800 rounded-md">
              <Lock className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">
                You are viewing permissions in read-only mode.
              </p>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading permissions...</span>
          </div>
        ) : (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex flex-wrap h-auto">
              <TabsTrigger value="all" className="relative">
                All
                <Badge className="ml-2" variant="secondary">{availablePermissions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="role" className="relative">
                Role-based
                <Badge className="ml-2" variant="secondary">{roleCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="individual" className="relative">
                Individual
                <Badge className="ml-2" variant="secondary">{individualCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="effective" className="relative">
                Effective
                <Badge className="ml-2" variant="secondary">{effectiveCount}</Badge>
              </TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category.toLowerCase()} className="relative">
                  {category}
                  <Badge className="ml-2" variant="secondary">
                    {availablePermissions.filter(p => p.category === category).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              {Object.entries(groupedPermissions).length > 0 ? (
                Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-lg font-semibold">{category}</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {permissions.map((permission) => {
                        const isGrantedByRole = isRolePermission(permission.id);
                        const isSelected = selectedPermissions.includes(permission.id);
                        
                        return (
                          <div 
                            key={permission.id} 
                            className={`p-3 rounded-md border ${
                              isGrantedByRole ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800' :
                              isSelected ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' :
                              'bg-white border-gray-200 dark:bg-gray-950 dark:border-gray-800'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="pt-0.5">
                                <Checkbox
                                  id={permission.id}
                                  checked={isSelected}
                                  onCheckedChange={() => handleTogglePermission(permission.id)}
                                  disabled={readOnly || isGrantedByRole}
                                  className={isGrantedByRole ? 'bg-blue-500 text-primary-foreground' : ''}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={permission.id} className="font-medium">
                                    {permission.name}
                                  </Label>
                                  {isGrantedByRole && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Role
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{permission.description}</p>
                                <div className="text-xs text-muted-foreground mt-2 font-mono">{permission.id}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>No permissions found matching your criteria.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        
        {!readOnly && (
          <Button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Permissions
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Role badge component to show role with appropriate styling
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const roleInfo = getRoleInfo(role);
  const IconComponent = getIconComponent(roleInfo.icon as keyof typeof Icons) || Icons.User;
  
  return (
    <Badge variant="outline" className={roleInfo.color}>
      <IconComponent className="h-3.5 w-3.5 mr-1" />
      {roleInfo.label}
    </Badge>
  );
};
