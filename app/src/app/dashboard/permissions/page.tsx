'use client';

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
  Users, 
  Shield,
  Info,
  AlertTriangle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/shared/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/shared/components/ui/breadcrumb";
import { useRouter } from 'next/navigation';
import { PermissionClient } from '@/features/permissions/lib/clients/PermissionClient';
import { createPermissionDefinitionList, getAllPermissionCodes } from '@/domain/permissions/SystemPermissionMap';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/enums/UserEnums';
import PermissionRoleManager from './components/PermissionRoleManager';
import PermissionUserAssignment from './components/PermissionUserAssignment';
import PermissionList from './components/PermissionList';


export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState('permissions'); // Set permissions as default tab
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDefinitions, setPermissionDefinitions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const router = useRouter();

  // Create a memoized fetch function to improve performance and allow reuse
  const fetchPermissionData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First, ensure we have a valid token before making requests
      const { default: TokenManager } = await import('@/core/initialization/TokenManager');
      const initialized = await TokenManager.initialize();
      
      if (!initialized) {
        throw new Error('Failed to initialize token');
      }
      
      // Get all possible permission codes from the enum
      const allEnumPermCodes = Object.values(SystemPermission).map(p => p.toString());
      console.log(`Found ${allEnumPermCodes.length} permissions in SystemPermission enum`);
      
      // Create definitions for all permissions defined in the enum
      const allDefinitions = createPermissionDefinitionList(allEnumPermCodes);
      setPermissionDefinitions(allDefinitions);
      console.log(`Created ${allDefinitions.length} permission definitions`);
      
      // Fetch all permissions from API - throws error if it fails
      const allPermsResponse = await PermissionClient.getPermissions({
        limit: 1000 // Set high limit to get all permissions
      });
      
      // If API call fails, throw error
      if (!allPermsResponse.success) {
        throw new Error(`Failed to get permissions: ${allPermsResponse.message || 'Unknown error'}`);
      }
      
      // Then fetch role permissions for each role
      const roleData: Record<string, string[]> = {};
      
      for (const role of Object.values(UserRole)) {
        // Get role permissions - throw error if it fails
        const response = await PermissionClient.getDefaultPermissionsForRole(role);
        
        if (!response.success) {
          throw new Error(`Failed to get permissions for role ${role}: ${response.message || 'Unknown error'}`);
        }
        
        if (!response.data || (!Array.isArray(response.data) && !response.data.permissions)) {
          throw new Error(`Invalid response format for role ${role}`);
        }
        
        // Handle different response formats
        if (typeof response.data === 'object' && 'permissions' in response.data && Array.isArray(response.data.permissions)) {
          roleData[role] = response.data.permissions;
        } else if (Array.isArray(response.data)) {
          roleData[role] = response.data;
        } else {
          throw new Error(`Unexpected response format for role ${role}`);
        }
        
        console.log(`Loaded ${roleData[role].length} permissions for role ${role}`);
        
        // Small delay to prevent concurrent requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Set role permissions
      setRolePermissions(roleData);
      
    } catch (err) {
      console.error('Error loading permission data:', err);
      setError(`Failed to load permission data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Show error alert - don't hide or recover from errors
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch permissions on component mount
  useEffect(() => {
    fetchPermissionData().catch(err => {
      console.error('Error in permission data fetch:', err);
      // Error is already set in the fetchPermissionData function
    });
  }, [fetchPermissionData]);

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
        <Button 
          variant="outline" 
          onClick={fetchPermissionData}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Permissions
        </Button>
      </div>
      
      {/* Error Alert - Make errors very visible */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Permissions</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {error}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchPermissionData}
                disabled={isLoading}
              >
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Permissions System</AlertTitle>
        <AlertDescription>
          The permissions system determines what actions users can perform in the application.
          Permissions are assigned based on user roles and can be customized for individual users.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 max-w-4xl">
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            All Permissions
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Role Permissions
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="admin">
            <Shield className="h-4 w-4 mr-2" />
            System Tools
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="permissions" className="space-y-4">
          <PermissionList 
            permissions={permissionDefinitions}
            isLoading={isLoading}
            error={error}
            onRefresh={fetchPermissionData}
          />
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-4">
          <PermissionRoleManager 
            rolePermissions={rolePermissions} 
            allPermissions={permissionDefinitions}
            isLoading={isLoading}
            error={error}
            onRefresh={fetchPermissionData}
          />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <PermissionUserAssignment onPermissionsChanged={fetchPermissionData} />
        </TabsContent>
        
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Administration</CardTitle>
              <CardDescription>
                Advanced tools for managing the permissions system. Use with caution.  
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert variant="warning" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Administrator Tools</AlertTitle>
                  <AlertDescription>
                    These tools should only be used by system administrators. Improper use could affect system functionality.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}