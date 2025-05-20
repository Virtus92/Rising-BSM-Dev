'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Clock, 
  Edit,
  Calendar,
  Key,
  Lock
} from 'lucide-react';
import { UserService } from '@/features/users/lib/services/UserService';
import { UserDto } from '@/domain/dtos/UserDtos';
import { UserRole, UserStatus } from '@/domain/entities/User';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import UserPermissions from '@/features/users/components/UserPermissions';
import { UserActivity } from '@/features/users/components/UserActivity';
import { PasswordResetForm } from '@/features/users/components/PasswordResetForm';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params?.id ? Number(params.id) : null;
  
  // Get permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewUsers = hasPermission(API_PERMISSIONS.USERS.VIEW);
  const canEditUsers = hasPermission(API_PERMISSIONS.USERS.UPDATE);
  const canManagePermissions = hasPermission(API_PERMISSIONS.USERS.MANAGE_PERMISSIONS);
  
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showUserPermissions, setShowUserPermissions] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check for reset password param in URL
  useEffect(() => {
    if (searchParams.get('resetPassword') === 'true') {
      setShowPasswordReset(true);
    }
  }, [searchParams]);

  // Close dialogs when navigating away to prevent focus-trap issues
  useEffect(() => {
    return () => {
      setShowUserPermissions(false);
      setShowPasswordReset(false);
    };
  }, []);

  useEffect(() => {
    // Skip fetch if no permission
    if (!canViewUsers && !permissionsLoading) {
      setIsLoading(false);
      return;
    }
    
    const fetchUser = async () => {
      if (!userId) {
        setError('Invalid user ID');
        setIsLoading(false);
        return;
      }

      try {
        const response = await UserService.getUserById(userId);
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          setError(response.error || 'Failed to fetch user details');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have permission and we're not loading permissions
    if (canViewUsers && !permissionsLoading) {
      fetchUser();
    }
  }, [userId, canViewUsers, permissionsLoading]);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case UserRole.MANAGER:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case UserRole.EMPLOYEE:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success' as const;
      case UserStatus.INACTIVE:
        return 'secondary' as const;
      case UserStatus.SUSPENDED:
        return 'warning' as const;
      case UserStatus.DELETED:
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  // Loading state while checking permissions
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // No permission state
  if (!canViewUsers) {
    return (
      <NoPermissionView 
        title="Access Denied"
        message="You don't have permission to view user details."
        permissionNeeded={API_PERMISSIONS.USERS.VIEW}
        ctaText="Return to Dashboard"
        ctaLink="/dashboard"
        showHomeButton={false}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            disabled
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-4 sm:p-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error || 'User not found'}
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Handle closing dialogs - use separate handlers for each dialog
  const handleClosePasswordReset = () => {
    setShowPasswordReset(false);
  };

  const handleClosePermissions = () => {
    setShowUserPermissions(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">User Details</h1>
        </div>
        
        {canEditUsers && (
          <Button 
            onClick={() => router.push(`/dashboard/users/edit/${user.id}`)}
            disabled={user.status === UserStatus.DELETED}
            className="w-full sm:w-auto"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Button>
        )}
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.name} 
                  className="rounded-full w-32 h-32 object-cover border-2 border-primary"
                />
              ) : (
                <div className="rounded-full w-32 h-32 bg-muted flex items-center justify-center">
                  <UserIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{user.name}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium break-all">{user.email}</div>
                </div>
              </div>
              
              {user.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{user.phone}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Role</div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role as UserRole)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div>
                    <Badge variant={getStatusBadgeVariant(user.status as UserStatus)}>
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col space-y-2">
              {canEditUsers && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordReset(true)}
                  disabled={user.status === UserStatus.DELETED}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Reset Password
                </Button>
              )}
              
              {canManagePermissions && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserPermissions(true)}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  View Permissions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for additional info */}
        <div className="md:col-span-2">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Created</div>
                      <div className="font-medium">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Last Updated</div>
                      <div className="font-medium">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(user.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* User's permissions would go here */}
                  <div className="mt-6">
                    <h3 className="text-md font-medium mb-2">Permissions</h3>
                    <div className="text-muted-foreground text-sm">
                      Permissions based on role: <span className="font-medium">{user.role}</span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {user.role === UserRole.ADMIN && (
                        <>
                          <Badge className="justify-start" variant="secondary">Manage Users</Badge>
                          <Badge className="justify-start" variant="secondary">Manage Roles</Badge>
                          <Badge className="justify-start" variant="secondary">System Settings</Badge>
                          <Badge className="justify-start" variant="secondary">View Analytics</Badge>
                          <Badge className="justify-start" variant="secondary">Manage Customers</Badge>
                          <Badge className="justify-start" variant="secondary">Manage Requests</Badge>
                          <Badge className="justify-start" variant="secondary">Manage Appointments</Badge>
                        </>
                      )}
                      
                      {user.role === UserRole.MANAGER && (
                        <>
                          <Badge className="justify-start" variant="secondary">View Users</Badge>
                          <Badge className="justify-start" variant="secondary">Manage Appointments</Badge>
                          <Badge className="justify-start" variant="secondary">View Analytics</Badge>
                          <Badge className="justify-start" variant="secondary">Manage Customers</Badge>
                          <Badge className="justify-start" variant="secondary">Manage Requests</Badge>
                        </>
                      )}
                      
                      {user.role === UserRole.EMPLOYEE && (
                        <>
                          <Badge className="justify-start" variant="secondary">View Appointments</Badge>
                          <Badge className="justify-start" variant="secondary">Manage Own Appointments</Badge>
                          <Badge className="justify-start" variant="secondary">View Customers</Badge>
                          <Badge className="justify-start" variant="secondary">View Requests</Badge>
                        </>
                      )}
                      
                      {user.role === UserRole.USER && (
                        <>
                          <Badge className="justify-start" variant="secondary">View Own Profile</Badge>
                          <Badge className="justify-start" variant="secondary">Manage Own Appointments</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity">
              <UserActivity userId={Number(user.id)} limit={10} />
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-md font-medium mb-2">Account Status</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeVariant(user.status as UserStatus)}>
                          {user.status}
                        </Badge>
                        {user.status === UserStatus.ACTIVE ? (
                          <span className="text-sm text-muted-foreground">Account is active and can access the system</span>
                        ) : user.status === UserStatus.INACTIVE ? (
                          <span className="text-sm text-muted-foreground">Account is inactive and cannot log in</span>  
                        ) : user.status === UserStatus.SUSPENDED ? (
                          <span className="text-sm text-muted-foreground">Account is temporarily suspended</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Account has been marked as deleted</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-md font-medium mb-2">Password Management</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowPasswordReset(true)}
                          disabled={user.status === UserStatus.DELETED || !canEditUsers}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Password Reset Dialog */}
      {showPasswordReset && (
        <Dialog open={showPasswordReset} onOpenChange={handleClosePasswordReset}>
          <DialogContent className={`${isMobile ? 'w-[calc(100%-2rem)] p-4' : ''}`}>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
            </DialogHeader>
            <PasswordResetForm 
              userId={Number(user.id)}
              onSuccess={handleClosePasswordReset}
              onCancel={handleClosePasswordReset}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* User Permissions Dialog */}
      {showUserPermissions && (
        <Dialog open={showUserPermissions} onOpenChange={handleClosePermissions}>
          <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Permissions</DialogTitle>
            </DialogHeader>
            <UserPermissions 
              user={user}
              onSave={async (permissions: string[]) => {
                // In a real implementation, you would call the API to save permissions
                console.log('Saving permissions:', permissions);
                handleClosePermissions();
              }}
              onCancel={handleClosePermissions}
              readOnly={!canManagePermissions} // Only allow editing if user has permission
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}