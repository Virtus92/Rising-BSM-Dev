'use client';

import React, { useState, useEffect } from 'react';
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
import { Loader2, Save, CheckCircle, X, Filter, Search, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { PermissionClient } from '@/features/permissions/lib/clients/PermissionClient';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/enums/UserEnums';
import { getRoleInfo } from '@/shared/components/permissions/RoleConfig';
import { usePermissions } from '@/features/users/hooks/usePermissions';
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
}

const PermissionRoleManager: React.FC<PermissionRoleManagerProps> = ({
  rolePermissions,
  allPermissions,
  isLoading,
  error: propError
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
    if (rolePermissions && rolePermissions[activeRole]) {
      const permissions = rolePermissions[activeRole];
      // Ensure rolePerms is always an array
      setRolePerms(Array.isArray(permissions) ? permissions : []);
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
    
    return allPermissions.filter(permission => {
      const matchesText = !filterText || 
        permission.name.toLowerCase().includes(filterText.toLowerCase()) ||
        permission.description.toLowerCase().includes(filterText.toLowerCase()) ||
        permission.code.toLowerCase().includes(filterText.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || permission.category === categoryFilter;
      
      return matchesText && matchesCategory;
    });
  }, [allPermissions, filterText, categoryFilter]);

  // Group filtered permissions by category
  const groupedPermissions = React.useMemo(() => {
    return filteredPermissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, PermissionItem[]>);
  }, [filteredPermissions]);

  // Toggle permission for role
  const togglePermission = (permissionCode: string) => {
    if (!canManagePermissions) return;
    
    setRolePerms(prev => {
      if (prev.includes(permissionCode)) {
        return prev.filter(p => p !== permissionCode);
      } else {
        return [...prev, permissionCode];
      }
    });
    
    setHasChanges(true);
  };

  // Save role permissions
  const saveRolePermissions = async () => {
    if (!canManagePermissions) {
      setError('You do not have permission to manage role permissions');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // This would be a real API call in a production environment
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage(`Permissions updated successfully for ${activeRole} role`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setHasChanges(false);
    } catch (err) {
      setError(`Failed to update role permissions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset role permissions to defaults
  const resetToDefaults = async () => {
    if (!canManagePermissions) {
      setError('You do not have permission to manage role permissions');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the API to get default permissions
      const response = await PermissionClient.getDefaultPermissionsForRole(activeRole);
      
      if (response.success && response.data) {
        setRolePerms(response.data);
        setSuccessMessage(`Reset to default permissions for ${activeRole} role`);
        setTimeout(() => setSuccessMessage(null), 3000);
        setHasChanges(false);
      } else {
        throw new Error(response.message || 'Failed to get default permissions');
      }
    } catch (err) {
      console.error('Error resetting permissions:', err);
      setError(`Failed to reset permissions: ${err instanceof Error ? err.message : String(err)}`);
      
      // Fallback to current role permissions from props
      if (rolePermissions && rolePermissions[activeRole]) {
        setRolePerms(rolePermissions[activeRole]);
      }
    } finally {
      setIsSaving(false);
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
                    Object.entries(groupedPermissions).map(([category, permissions]) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{category}</h3>
                          <Badge variant="outline">{permissions.length}</Badge>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                          {permissions.map(permission => {
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
                    ))
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
