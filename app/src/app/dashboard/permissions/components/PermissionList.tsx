'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { Loader2, Search, Filter, Info, CheckCircle, X, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';

// Type definition for permission item
interface PermissionItem {
  code: string;
  name: string;
  description: string;
  category: string;
}

interface PermissionListProps {
  permissions: PermissionItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => Promise<void>;
}

const PermissionList: React.FC<PermissionListProps> = ({ 
  permissions, 
  isLoading,
  error: propError,
  onRefresh
}) => {
  const [filterText, setFilterText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(propError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { hasPermission } = usePermissions();
  const canManagePermissions = hasPermission(SystemPermission.PERMISSIONS_MANAGE);

  // Get unique categories from permissions
  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(new Set(permissions.map(p => p.category)));
    return ['all', ...uniqueCategories.sort()];
  }, [permissions]);

  // Filter permissions based on search text and category
  const filteredPermissions = React.useMemo(() => {
    return permissions.filter(permission => {
      const matchesText = !filterText || 
        permission.name.toLowerCase().includes(filterText.toLowerCase()) ||
        permission.description.toLowerCase().includes(filterText.toLowerCase()) ||
        permission.code.toLowerCase().includes(filterText.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || permission.category === categoryFilter;
      
      return matchesText && matchesCategory;
    });
  }, [permissions, filterText, categoryFilter]);

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

  // Permission card component
  const PermissionCard = ({ permission }: { permission: PermissionItem }) => (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{permission.name}</h3>
          <p className="text-sm text-muted-foreground">{permission.description}</p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <Badge variant="outline">{permission.category}</Badge>
        <code className="text-xs bg-muted px-2 py-1 rounded">{permission.code}</code>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>System Permissions</CardTitle>
              <CardDescription>
                View all available permissions in the system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onRefresh && (
                <Button 
                  variant="outline"
                  onClick={() => onRefresh()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>
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
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search permissions..." 
                className="pl-8"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading permissions...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedPermissions).length === 0 ? (
                <div className="text-center py-10">
                  <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Permissions Found</h3>
                  <p className="text-muted-foreground">
                    {filterText || categoryFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'No permissions have been configured yet'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{category}</h3>
                      <Badge variant="outline">{perms.length}</Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[800px] overflow-y-auto pr-2">
                      {perms.map(permission => (
                        <PermissionCard 
                          key={permission.code} 
                          permission={permission} 
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionList;