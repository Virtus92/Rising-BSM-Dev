'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Loader2, Save, CheckCircle, X, Filter, Search, ShieldAlert, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { PermissionClient } from '@/features/permissions/lib/clients/PermissionClient';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/enums/UserEnums';
import { getRoleInfo } from '@/shared/components/permissions/RoleConfig';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { getIconComponent } from '@/shared/utils/icon-utils';
import * as Icons from 'lucide-react';

// Type definition for permission item
interface PermissionItem {
  code: string;
  name: string;
  description: string;
  category: string;
}

interface PermissionRoleManagerProps {
  rolePermissions: Record<string, string[]>;
  allPermissions: PermissionItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => Promise<void>;
}

const PermissionRoleManager: React.FC<PermissionRoleManagerProps> = ({
  rolePermissions,
  allPermissions,
  isLoading,
  error: propError,
  onRefresh
}) => {
  const [activeRole, setActiveRole] = useState<string>(UserRole.ADMIN);
  const [filterText, setFilterText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(propError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const { hasPermission } = usePermissions();
  const canManagePermissions = hasPermission(SystemPermission.PERMISSIONS_MANAGE);

  // Reset error when prop error changes
  useEffect(() => {
    setError(propError);
  }, [propError]);

  // Update role permissions when active role changes
  useEffect(() => {
    if (rolePermissions && activeRole) {
      // Handle different possible data structures
      let permissions: string[] = [];
      
      // Direct access from rolePermissions object
      if (rolePermissions[activeRole]) {
        const roleData = rolePermissions[activeRole];
        
        // Check if it's a direct array
        if (Array.isArray(roleData)) {
          permissions = roleData;
        }
      }
      
      // Set permissions ensuring it's always an array
      setRolePerms(permissions);
      setHasChanges(false);
    } else {
      setRolePerms([]);
    }
  }, [activeRole, rolePermissions]);

  // Get unique categories from permissions
  useEffect(() => {
    if (allPermissions && allPermissions.length > 0) {
      const categories = Array.from(new Set(allPermissions.map(p => p.category))).sort();
      setAllCategories(['all', ...categories]);
    }
  }, [allPermissions]);

  // Filter permissions based on search text and category
  const filteredPermissions = React.useMemo(() => {
    if (!allPermissions) return [];
    
    // Debug the input permissions
    console.log(`Filtering ${allPermissions.length} total permissions with filterText: '${filterText}' and categoryFilter: '${categoryFilter}'`);
    
    // Add additional logging for category distribution
    const categories: Record<string, number> = {};
    allPermissions.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    console.log('Permission distribution by category:', categories);
    
    // Apply filtering
    const filtered = allPermissions.filter(permission => {
      const matchesText = !filterText || 
        permission.name.toLowerCase().includes(filterText.toLowerCase()) ||
        permission.description.toLowerCase().includes(filterText.toLowerCase()) ||
        permission.code.toLowerCase().includes(filterText.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || permission.category === categoryFilter;
      
      return matchesText && matchesCategory;
    });
    
    // Log filter results for debugging
    console.log(`Filter result: ${filtered.length} permissions after filtering`);
    
    return filtered;
  }, [allPermissions, filterText, categoryFilter]);

  // Group filtered permissions by category with explicit debugging
  const groupedPermissions = React.useMemo(() => {
    // Log the total number of permissions being processed
    console.log(`Processing ${filteredPermissions.length} filtered permissions for grouping`);
    
    // Create grouped permissions with logging
    const result = filteredPermissions.reduce<Record<string, PermissionItem[]>>((acc, permission) => {
      // Initialize the category array if it doesn't exist
      if (!acc[permission.category]) {
        acc[permission.category] = [];
        console.log(`Created new category: ${permission.category}`);
      }
      
      // Always add the permission to its category group
      acc[permission.category].push(permission);
      
      return acc;
    }, {});
    
    // Log the final grouping results with detailed information
    console.log(`Grouped permissions into ${Object.keys(result).length} categories:`, 
      Object.entries(result).map(([cat, perms]) => `${cat}: ${perms.length} permissions`));
    
    // Additional debug logging to verify permission counts
    Object.entries(result).forEach(([category, permissions]) => {
      console.log(`Category ${category} has ${permissions.length} permissions:`, 
        permissions.map(p => p.code).join(', '));
    });
    
    return result;
  }, [filteredPermissions]);

  // Toggle permission for role
  const togglePermission = useCallback((permissionCode: string) => {
    if (!canManagePermissions) return;
    
    setRolePerms(prev => {
      if (prev.includes(permissionCode)) {
        return prev.filter(p => p !== permissionCode);
      } else {
        return [...prev, permissionCode];
      }
    });
    
    setHasChanges(true);
  }, [canManagePermissions]);

  // Save role permissions with improved error handling and token management
  const saveRolePermissions = async () => {
    if (!canManagePermissions) {
      setError('You do not have permission to manage role permissions');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Create a specific data structure for the update
      const updateData = {
        role: activeRole,
        permissions: rolePerms
      };
      
      // Ensure we have a valid token before making the request
      const { default: TokenManager } = await import('@/core/initialization/TokenManager');
      await TokenManager.initialize();
      const token = await TokenManager.getToken();
      
      if (!token) {
        throw new Error('Authentication token not available. Please try logging in again.');
      }
      
      // Make the API call with proper error handling
      const response = await fetch(`/api/permissions/role-defaults/${activeRole}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Request-ID': `role-perms-save-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        },
        body: JSON.stringify(updateData),
      });
      
      // Check for authentication errors
      if (response.status === 401) {
        // Try to refresh the token and retry
        const refreshed = await TokenManager.refreshToken({ force: true });
        
        if (refreshed) {
          // Get the new token
          const newToken = await TokenManager.getToken();
          
          if (newToken) {
            // Retry the request with the new token
            const retryResponse = await fetch(`/api/permissions/role-defaults/${activeRole}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'X-Request-ID': `role-perms-save-retry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
              },
              body: JSON.stringify(updateData),
            });
            
            // Process the retry response
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              
              if (retryData.success) {
                if (isMounted.current) {
                  setSuccessMessage(`Permissions updated successfully for ${activeRole} role`);
                  setTimeout(() => isMounted.current && setSuccessMessage(null), 3000);
                  setHasChanges(false);
                }
                
                // Refresh parent data if needed
                if (onRefresh) {
                  await onRefresh();
                }
                
                return; // Exit early on successful retry
              }
            }
          }
        }
        
        // If we reach here, the retry failed
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Check HTTP response status for other errors
      if (!response.ok) {
        // Try to get error details from response body
        try {
          const errorData = await response.json();
          throw new Error(
            errorData.message || 
            `Failed to update role permissions: ${response.statusText} (${response.status})`
          );
        } catch (jsonError) {
          // If we can't parse the JSON, just use the status text
          throw new Error(`Failed to update role permissions: ${response.statusText} (${response.status})`);
        }
      }
      
      // Parse response data
      const data = await response.json();
      
      // Check for success flag in response
      if (!data.success) {
        throw new Error(
          data.message || 
          `Server returned an unsuccessful response: ${JSON.stringify(data.error || {})}`
        );
      }
      
      if (isMounted.current) {
        // Show success message
        setSuccessMessage(`Permissions updated successfully for ${activeRole} role`);
        setTimeout(() => isMounted.current && setSuccessMessage(null), 3000);
        setHasChanges(false);
      }
      
      // Refresh parent data if needed
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Error saving role permissions:', err);
      
      if (isMounted.current) {
        setError(`Failed to update role permissions: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  };

  // Keep track of component mount state
  const isMounted = useRef(true);
  
  // Setup cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Reset role permissions to defaults with improved token handling
  const resetToDefaults = async () => {
    if (!canManagePermissions) {
      setError('You do not have permission to manage role permissions');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Ensure we have a valid token before making the request
      const { default: TokenManager } = await import('@/core/initialization/TokenManager');
      await TokenManager.initialize();
      const token = await TokenManager.getToken();
      
      if (!token) {
        throw new Error('Authentication token not available. Please try logging in again.');
      }
      
      // Log the reset operation for debugging
      console.log(`Resetting permissions for role ${activeRole} to defaults`);
      
      // Use a single approach with TokenManager
      const response = await fetch(`/api/permissions/role-defaults/${activeRole}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-ID': `role-defaults-${activeRole}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        }
      });
      
      // Check for authentication errors
      if (response.status === 401) {
        // Try to refresh the token and retry
        const refreshed = await TokenManager.refreshToken({ force: true });
        
        if (refreshed) {
          // Get the new token
          const newToken = await TokenManager.getToken();
          
          if (newToken) {
            // Retry the request with the new token
            const retryResponse = await fetch(`/api/permissions/role-defaults/${activeRole}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'X-Request-ID': `role-defaults-retry-${activeRole}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
              }
            });
            
            // Check if retry was successful
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              
              if (retryData.success && retryData.data) {
                // Extract permissions array from response
                let roleDefaultPerms: string[] = [];
                
                if (Array.isArray(retryData.data)) {
                  roleDefaultPerms = retryData.data;
                } else if (typeof retryData.data === 'object' && 'permissions' in retryData.data && 
                           Array.isArray(retryData.data.permissions)) {
                  roleDefaultPerms = retryData.data.permissions;
                }
                
                if (roleDefaultPerms.length > 0 && isMounted.current) {
                  // Log the permissions we're setting
                  console.log(`Setting ${roleDefaultPerms.length} default permissions for role ${activeRole} after retry`);
                  
                  setRolePerms(roleDefaultPerms);
                  setSuccessMessage(`Reset to default permissions for ${activeRole} role`);
                  setTimeout(() => isMounted.current && setSuccessMessage(null), 3000);
                  setHasChanges(false);
                  
                  // Refresh parent data
                  if (onRefresh) {
                    await onRefresh();
                  }
                  
                  return; // Exit early on successful retry
                }
              }
            }
          }
        }
        
        // If we reach here, the retry failed
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Handle non-success response
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse response data
      const data = await response.json();
      
      let roleDefaultPerms: string[] = [];
      let successfulReset = false;
      
      if (data.success && data.data) {
        // Handle different response formats
        if (Array.isArray(data.data)) {
          roleDefaultPerms = data.data;
          successfulReset = true;
          console.log(`API returned ${roleDefaultPerms.length} permissions directly as array`);
        } else if (typeof data.data === 'object') {
          if ('permissions' in data.data && Array.isArray(data.data.permissions)) {
            roleDefaultPerms = data.data.permissions;
            successfulReset = true;
            console.log(`API returned ${roleDefaultPerms.length} permissions in permissions property`);
          }
        }
      }
      
      // Set the permissions if successful
      if (successfulReset && roleDefaultPerms.length > 0) {
        if (isMounted.current) {
          console.log(`Setting ${roleDefaultPerms.length} default permissions for role ${activeRole}`);
          setRolePerms(roleDefaultPerms);
          setSuccessMessage(`Reset to default permissions for ${activeRole} role`);
          setTimeout(() => isMounted.current && setSuccessMessage(null), 3000);
          setHasChanges(false);
        }
        
        // Refresh parent data
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        // Fall back to the API client as a last resort
        try {
          console.log(`Falling back to PermissionClient for default permissions of role ${activeRole}`);
          const apiResponse = await PermissionClient.getDefaultPermissionsForRole(activeRole);
          
          if (apiResponse.success && apiResponse.data) {
            const perms = Array.isArray(apiResponse.data) ? apiResponse.data : [];
            
            if (isMounted.current) {
              console.log(`Client API returned ${perms.length} default permissions for role ${activeRole}`);
              setRolePerms(perms);
              setSuccessMessage(`Reset to default permissions for ${activeRole} role`);
              setTimeout(() => isMounted.current && setSuccessMessage(null), 3000);
              setHasChanges(false);
            }
            
            // Refresh parent data
            if (onRefresh) {
              await onRefresh();
            }
            
            return; // Exit early if successful
          }
        } catch (apiError) {
          console.error('Error using PermissionClient as fallback:', apiError);
          // Continue to error handling
        }
        
        throw new Error('Failed to get default permissions from API');
      }
    } catch (err) {
      console.error('Error resetting permissions:', err);
      if (isMounted.current) {
        setError(`Failed to reset permissions: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      // Fallback to current role permissions from props
      if (rolePermissions && rolePermissions[activeRole] && isMounted.current) {
        setRolePerms(rolePermissions[activeRole]);
      }
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  };

  // Get role information
  const getRoleDisplay = (role: string) => {
    const roleInfo = getRoleInfo(role);
    const IconComponent = getIconComponent(roleInfo.icon as keyof typeof Icons) || Icons.User;
    const permCount = rolePermissions[role]?.length || 0;
    
    return (
      <div className="flex items-center space-x-2">
        <IconComponent className="h-4 w-4" />
        <span>{roleInfo.label}</span>
        <Badge variant="outline" className="ml-1">
          {permCount}
        </Badge>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
        <CardDescription>
          Manage permissions assigned to each user role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {successMessage && (
          <Alert variant="success" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue={activeRole} onValueChange={setActiveRole} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
            {Object.values(UserRole).map(role => (
              <TabsTrigger key={role} value={role} className="relative">
                {getRoleDisplay(role)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.values(UserRole).map(role => (
            <TabsContent key={role} value={role} className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-4">
                <h3 className="font-medium mb-1">{getRoleInfo(role).label} Role</h3>
                <p className="text-sm text-muted-foreground">
                  {getRoleInfo(role).description}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search permissions..." 
                    className="pl-8"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {allCategories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading permissions...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).length === 0 ? (
                    <div className="text-center py-10">
                      <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <h3 className="text-lg font-medium">No Permissions Found</h3>
                      <p className="text-muted-foreground">
                        {filterText || categoryFilter !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'No permissions have been configured yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Display stats summary of visible permissions */}
                      <div className="bg-secondary/20 p-3 rounded-md">
                        <p className="text-sm font-medium">
                          Displaying {filteredPermissions.length} permissions across {Object.keys(groupedPermissions).length} categories
                        </p>
                      </div>
                      
                      {/* Render each category with its permissions */}
                      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                        // Debug log to verify all permissions in each category
                        console.log(`Rendering category ${category} with ${categoryPermissions.length} permissions`);
                        return (
                          <div key={category} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">{category}</h3>
                              <Badge variant="outline">{categoryPermissions.length}</Badge>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-[800px] overflow-y-auto pr-2">
                              {/* Map ALL permissions from this category - not a limited subset */}
                              {categoryPermissions.map((permission: PermissionItem) => {
                                const hasPermission = rolePerms.includes(permission.code);
                                
                                return (
                                  <div 
                                    key={permission.code} 
                                    className={`p-3 border rounded-md ${
                                      hasPermission 
                                        ? 'bg-primary/5 border-primary/20' 
                                        : 'bg-background border-input'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="pt-0.5">
                                        <Checkbox
                                          id={`${role}-${permission.code}`}
                                          checked={hasPermission}
                                          onCheckedChange={() => togglePermission(permission.code)}
                                          disabled={!canManagePermissions || isSaving}
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <Label 
                                          htmlFor={`${role}-${permission.code}`}
                                          className="font-medium cursor-pointer"
                                        >
                                          {permission.name}
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {permission.description}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between">
                                          <Badge variant="outline" className="text-xs">
                                            {category}
                                          </Badge>
                                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                            {permission.code}
                                          </code>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={resetToDefaults}
            disabled={!canManagePermissions || isSaving || isLoading}
          >
            Reset to Defaults
          </Button>
          
          {onRefresh && (
            <Button 
              variant="outline" 
              onClick={() => onRefresh()}
              disabled={isLoading || isSaving}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
        <Button 
          onClick={saveRolePermissions}
          disabled={!canManagePermissions || isSaving || isLoading || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {hasChanges ? 'Save Changes' : 'Saved'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PermissionRoleManager;