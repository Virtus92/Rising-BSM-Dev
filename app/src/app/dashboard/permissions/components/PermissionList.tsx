'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Loader2, Search, Filter, Plus, Info, CheckCircle, X, Edit, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { PermissionClient } from '@/features/permissions/lib/clients';

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PermissionItem | null>(null);
  const [newPermission, setNewPermission] = useState({
    code: '',
    name: '',
    description: '',
    category: ''
  });
  const [error, setError] = useState<string | null>(propError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle creating a new permission
  const handleCreatePermission = async () => {
    if (!canManagePermissions) {
      setError('You do not have permission to create permissions');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate input
      if (!newPermission.code || !newPermission.name || !newPermission.category) {
        setError('Code, name, and category are required');
        setIsSubmitting(false);
        return;
      }
      
      // Create the actual permission using PermissionClient
      const response = await PermissionClient.createPermission({
        code: newPermission.code,
        name: newPermission.name,
        description: newPermission.description,
        category: newPermission.category
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create permission');
      }
      
      // Close dialog and reset form
      setCreateDialogOpen(false);
      setNewPermission({
        code: '',
        name: '',
        description: '',
        category: ''
      });
      
      setSuccessMessage('Permission created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the permissions list
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(`Failed to create permission: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating a permission
  const handleUpdatePermission = async () => {
    if (!canManagePermissions || !selectedPermission) {
      setError('You do not have permission to update permissions');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate input
      if (!selectedPermission.code || !selectedPermission.name || !selectedPermission.category) {
        setError('Code, name, and category are required');
        setIsSubmitting(false);
        return;
      }
      
      // Find the permission by code
      const findResponse = await PermissionClient.getPermissionByCode(selectedPermission.code);
      if (!findResponse.success || !findResponse.data) {
        throw new Error(`Permission not found: ${selectedPermission.code}`);
      }
      
      // Update the permission
      const response = await PermissionClient.updatePermission(findResponse.data.id, {
        name: selectedPermission.name,
        description: selectedPermission.description,
        category: selectedPermission.category
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update permission');
      }
      
      // Close dialog
      setEditDialogOpen(false);
      setSelectedPermission(null);
      
      setSuccessMessage('Permission updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the permissions list
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(`Failed to update permission: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Permission card component
  const PermissionCard = ({ permission }: { permission: PermissionItem }) => (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{permission.name}</h3>
          <p className="text-sm text-muted-foreground">{permission.description}</p>
        </div>
        {canManagePermissions && (
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => {
                setSelectedPermission({...permission});
                setEditDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}
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
                View and manage all available permissions in the system
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
              {canManagePermissions && (
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Permission
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      
      {/* Create Permission Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Add a new permission to the system. This will be available for assignment to users and roles.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Permission Code</Label>
              <Input 
                id="code" 
                placeholder="e.g., USERS_MANAGE"
                value={newPermission.code}
                onChange={(e) => setNewPermission({...newPermission, code: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for the permission. Use uppercase and underscores.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                placeholder="e.g., Manage Users"
                value={newPermission.name}
                onChange={(e) => setNewPermission({...newPermission, name: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input 
                id="category" 
                placeholder="e.g., User Management"
                value={newPermission.category}
                onChange={(e) => setNewPermission({...newPermission, category: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe what this permission allows users to do"
                value={newPermission.description}
                onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePermission} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Permission Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update the details of this permission.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPermission && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Permission Code</Label>
                <Input 
                  id="edit-code" 
                  value={selectedPermission.code}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Permission code cannot be changed after creation.
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input 
                  id="edit-name" 
                  value={selectedPermission.name}
                  onChange={(e) => setSelectedPermission({...selectedPermission, name: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input 
                  id="edit-category" 
                  value={selectedPermission.category}
                  onChange={(e) => setSelectedPermission({...selectedPermission, category: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  value={selectedPermission.description}
                  onChange={(e) => setSelectedPermission({...selectedPermission, description: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePermission} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionList;
