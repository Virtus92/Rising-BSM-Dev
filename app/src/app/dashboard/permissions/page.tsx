'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/shared/components/ui/tabs";
import { 
  Settings, 
  Users, 
  Shield,
  CheckCircle,
  Book,
  AlertTriangle,
  Lock,
  Info,
  ArrowLeft
} from 'lucide-react';
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/shared/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/shared/components/ui/breadcrumb";
import { Input } from "@/shared/components/ui/input";
import { useRouter } from 'next/navigation';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { PermissionClient } from '@/features/permissions/lib/clients/PermissionClient';
import { SystemPermissionMap, createPermissionDefinitionList } from '@/domain/permissions/SystemPermissionMap';
import { UserRole } from '@/domain/enums/UserEnums';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import PermissionRoleManager from './components/PermissionRoleManager';
import PermissionList from './components/PermissionList';
import PermissionUserAssignment from './components/PermissionUserAssignment';

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDefinitions, setPermissionDefinitions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchPermissionData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all permissions
        const allPerms = await PermissionClient.getPermissions({
          limit: 100
        });
        
        if (allPerms.success && allPerms.data) {
          const permCodes = allPerms.data.data.map((p: any) => p.code);
          const definitions = createPermissionDefinitionList(permCodes);
          setPermissionDefinitions(definitions);
        }
        
        // Get role permissions
        const roleData: Record<string, string[]> = {};
        
        for (const role of Object.values(UserRole)) {
          try {
            const response = await PermissionClient.getDefaultPermissionsForRole(role);
            if (response.success && response.data) {
              roleData[role] = response.data;
            }
          } catch (error) {
            console.error(`Error loading permissions for role ${role}:`, error);
          }
        }
        
        setRolePermissions(roleData);
        
      } catch (error) {
        console.error('Error loading permission data:', error);
        setError('Failed to load permission data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPermissionData();
  }, []);

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Permissions Management</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Permissions Management</h1>
            <p className="text-muted-foreground">
              Configure and manage system permissions and role access
            </p>
          </div>
        </div>
        
        <PermissionGuard permission={SystemPermission.SYSTEM_ADMIN}>
          <div className="flex gap-2">
            <Button variant="outline">
              <Book className="mr-2 h-4 w-4" />
              Documentation
            </Button>
            <Button>
              <Shield className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </PermissionGuard>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Permissions System</AlertTitle>
        <AlertDescription>
          The permissions system determines what actions users can perform in the application.
          Permissions are assigned based on user roles and can be customized for individual users.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-5 max-w-3xl">
          <TabsTrigger value="overview">
            <Info className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Users className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            User Assignment
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions System Overview</CardTitle>
              <CardDescription>
                Understanding how permissions work in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{permissionDefinitions.length}</div>
                    <p className="text-sm text-muted-foreground">
                      Total system permissions
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Roles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{Object.keys(rolePermissions).length}</div>
                    <p className="text-sm text-muted-foreground">
                      Default user roles
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {new Set(permissionDefinitions.map(p => p.category)).size}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Permission categories
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">How Permissions Work</h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Role-Based Permissions</h4>
                    <p className="text-sm text-muted-foreground">
                      Each user is assigned a role (Admin, Manager, Employee, User) which comes with a default set of permissions.
                      Role-based permissions provide a baseline access level for users with that role.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.keys(rolePermissions).map(role => (
                        <Badge key={role} variant="outline">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                          <span className="ml-1 text-xs opacity-70">
                            ({rolePermissions[role]?.length || 0})
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Individual User Permissions</h4>
                    <p className="text-sm text-muted-foreground">
                      In addition to role-based permissions, individual users can be granted specific permissions
                      that are not included in their role. This allows for fine-grained access control.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
                      <div className="flex items-start">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          A user's effective permissions are the combination of their role-based permissions
                          and any individual permissions that have been granted to them specifically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Alert variant="success" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Permission System Active</AlertTitle>
                <AlertDescription>
                  The permission system is active and functioning correctly. Users will only be able to access 
                  features and perform actions for which they have the appropriate permissions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-4">
          <PermissionList 
            permissions={permissionDefinitions} 
            isLoading={isLoading} 
            error={error} 
          />
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-4">
          <PermissionRoleManager 
            rolePermissions={rolePermissions} 
            allPermissions={permissionDefinitions}
            isLoading={isLoading}
            error={error}
          />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <PermissionUserAssignment />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission System Settings</CardTitle>
              <CardDescription>
                Configure how the permission system works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <Alert variant="warning" className="bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Admin Access Required</AlertTitle>
                  <AlertDescription>
                    Changing permission system settings requires system administrator access.
                    These changes can affect the entire application and all users.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">System Settings</h3>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Default Cache Duration</label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Input type="number" placeholder="30" className="max-w-[100px]" />
                          <span className="text-sm text-muted-foreground">minutes</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Time to cache permission information before refreshing
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Permission Check Behavior</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button variant="outline" className="justify-start px-3">
                            <Lock className="h-4 w-4 mr-2" />
                            Deny by Default
                          </Button>
                          <Button variant="default" className="justify-start px-3">
                            <Shield className="h-4 w-4 mr-2" />
                            Cache and Check
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          How to handle permission checks when system is unreachable
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Permission Audit Logging</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button variant="default" className="justify-start px-3">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Enabled
                          </Button>
                          <Button variant="outline" className="justify-start px-3">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Disabled
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Log all permission checks and changes for audit purposes
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Role Inheritance</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button variant="outline" className="justify-start px-3">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Enabled
                          </Button>
                          <Button variant="default" className="justify-start px-3">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Disabled
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Roles inherit permissions from lower roles automatically
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset to Defaults</Button>
              <Button disabled>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
