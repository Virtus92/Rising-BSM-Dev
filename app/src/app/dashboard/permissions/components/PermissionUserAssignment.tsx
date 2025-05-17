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
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { 
  Loader2, 
  Search, 
  RefreshCw, 
  Check,
  Users, 
  Shield,
  X,
  UserPlus,
  User as UserIcon
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/shared/components/ui/table";
import { 
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/shared/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { UserService } from '@/features/users/lib/services/UserService';
import { UserDto } from '@/domain/dtos/UserDtos';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { useRouter } from 'next/navigation';
import { UserPermissions } from '@/features/users/components/UserPermissions';

const PermissionUserAssignment: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { hasPermission } = usePermissions();
  const canManagePermissions = hasPermission(SystemPermission.PERMISSIONS_MANAGE);
  const canViewUsers = hasPermission(SystemPermission.USERS_VIEW);
  const router = useRouter();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch users
  const fetchUsers = async () => {
    if (!canViewUsers) {
      setError('You do not have permission to view users');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await UserService.getUsers({
        limit: 50,
        sortBy: 'name'
      });
      
      if (response.success && response.data) {
        setUsers(response.data.data);
      } else {
        setError(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(`Error fetching users: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query) ||
      (user.role && user.role.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  // Update user permissions
  const handleUpdatePermissions = async (permissions: string[]) => {
    if (!canManagePermissions || !selectedUser) {
      setError('You do not have permission to manage user permissions');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await UserService.updateUserPermissions(selectedUser.id, permissions);
      
      if (response.success) {
        setSuccessMessage(`Permissions updated successfully for ${selectedUser.name}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowPermissionsDialog(false);
      } else {
        setError(response.message || 'Failed to update permissions');
      }
    } catch (err) {
      setError(`Error updating permissions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get user avatar from name
  const getUserAvatar = (name: string) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Permission Assignment</CardTitle>
          <CardDescription>
            Manage individual user permissions and overrides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {successMessage && (
            <Alert variant="success" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900">
              <Check className="h-4 w-4" />
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
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button
              variant="outline"
              onClick={fetchUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="default"
              onClick={() => router.push('/dashboard/users/new')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        {searchQuery ? 'No users found matching your search' : 'No users found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user.profilePicture ? (
                                <AvatarImage src={user.profilePicture} alt={user.name} />
                              ) : null}
                              <AvatarFallback>{getUserAvatar(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role?.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/users/${user.id}`)}
                            >
                              <UserIcon className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowPermissionsDialog(true);
                              }}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Permissions
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* User Permissions Dialog */}
      {selectedUser && (
        <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Permissions</DialogTitle>
              <DialogDescription>
                Manage permissions for {selectedUser.name}
              </DialogDescription>
            </DialogHeader>
            <UserPermissions 
              user={selectedUser}
              onSave={handleUpdatePermissions}
              onCancel={() => setShowPermissionsDialog(false)}
              readOnly={!canManagePermissions}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PermissionUserAssignment;
