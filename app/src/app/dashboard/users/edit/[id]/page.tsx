'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { 
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/shared/components/ui/alert";
import { 
  ArrowLeft, 
  Loader2, 
  UserCog, 
  Shield, 
  KeyRound, 
  AlertTriangle,
  CheckCircle, 
  Save,
  User as UserIcon,
  Lock,
  ExternalLink,
  Pencil,
  Trash2
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/shared/components/ui/breadcrumb";
import { UserForm } from '@/features/users/components/UserForm';
// Import the enhanced UserPermissions component for better error handling
import UserPermissionsEnhanced from '@/features/users/components/UserPermissionsEnhanced';
import { UserDto } from '@/domain/dtos/UserDtos';
import { UserRole, UserStatus } from '@/domain/entities/User';
import { UserService } from '@/features/users/lib/services/UserService';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Separator } from "@/shared/components/ui/separator";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id ? Number(params.id) : null;
  
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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

  useEffect(() => {
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
          setError(response.message || 'Failed to fetch user details');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    
    // Get current user ID
    const getCurrentUser = async () => {
      try {
        const response = await UserService.getCurrentUser();
        if (response.success && response.data) {
          setCurrentUserId(response.data.id);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    
    getCurrentUser();
  }, [userId]);

  const handleUpdateUser = async (data: any) => {
    if (!userId) {
      setError('User ID is missing');
      return;
    }
    
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Create a safe copy of data
      const updatedData = { ...data };
      
      // Only convert role to lowercase if it exists
      if (updatedData.role) {
        updatedData.role = typeof updatedData.role === 'string' ? updatedData.role.toLowerCase() : updatedData.role;
      }
      
      // If status is being updated, use the dedicated status update endpoint
      if (data.status && Object.keys(data).length === 1) {
        const response = await UserService.updateUserStatus(userId, { 
          status: data.status
        });
        
        if (response.success) {
          setSuccess(true);
          
          // Update the local user state
          setUser(prev => prev ? {
            ...prev,
            status: data.status
          } : null);
          
          // Show success message for a short time
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        } else {
          setError(response.message || 'Failed to update user status');
        }
      } else {
        // Otherwise use the regular update endpoint for other data
        const response = await UserService.updateUser(userId, updatedData);
  
        if (response.success) {
          setSuccess(true);
          
          // Update the local user state safely
          setUser(prev => prev ? {
            ...prev,
            ...updatedData
          } : null);
          
          // Show success message for a short time
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        } else {
          setError(response.message || 'Failed to update user');
        }
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePermissions = async (permissions: string[]) => {
    if (!userId) {
      setError('User ID is missing');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await UserService.updateUserPermissions(userId, permissions);
      
      if (response.success) {
        setShowPermissionsDialog(false);
        setSuccess(true);
        
        // Show success message for a short time
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(response.message || 'Failed to update permissions');
      }
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError('Failed to update permissions');
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

  // Function to get status badge color
  const getStatusColor = (status?: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE: return "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900";
      case UserStatus.INACTIVE: return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
      case UserStatus.SUSPENDED: return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900";
      case UserStatus.DELETED: return "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900";
      default: return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-48" />
        </div>
        
        <Skeleton className="h-16 w-full mb-6" />
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
          <div className="md:col-span-3 space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
            <div className="flex justify-end space-x-2 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/users">Users</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Edit User</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'User not found'}</AlertDescription>
        </Alert>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          
          <Button 
            variant="default"
            onClick={() => router.push('/dashboard/users')}
          >
            View All Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/users">Users</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Edit {user?.name || 'User'}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Edit User</h1>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/users/${userId}`)}
          >
            <UserIcon className="mr-2 h-4 w-4" />
            View Profile
          </Button>
          
          <Button 
            variant="default"
            onClick={() => setShowPermissionsDialog(true)}
            disabled={user?.status === UserStatus.DELETED}
          >
            <Shield className="mr-2 h-4 w-4" />
            {isMobile ? 'Permissions' : 'Manage Permissions'}
          </Button>
        </div>
      </div>
      
      {/* User Summary Card */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="h-20 w-20 rounded-md bg-primary text-primary-foreground">
              <AvatarFallback>{user ? getUserAvatar(user.name) : "U"}</AvatarFallback>
              {user?.profilePicture && (
                <AvatarImage src={user.profilePicture} alt={user.name} />
              )}
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <div className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(user?.status as UserStatus)}`}>
                  {user?.status === UserStatus.ACTIVE ? 'Active' : 
                   user?.status === UserStatus.INACTIVE ? 'Inactive' : 
                   user?.status === UserStatus.SUSPENDED ? 'Suspended' : 
                   user?.status === UserStatus.DELETED ? 'Deleted' : 'Unknown'}
                </div>
                
                <div className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900">
                  {user?.role || 'Unknown Role'}
                </div>
                
                {user?.id === currentUserId && (
                  <div className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900">
                    Current User
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">Last updated:</span>
              <span className="text-sm">{user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Alerts */}
      {user?.status === UserStatus.DELETED && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Deleted User</AlertTitle>
          <AlertDescription>
            This user has been marked as deleted. Most edit operations are not available.
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-6 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>User information has been updated successfully.</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Main Content */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Edit Options</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={activeTab} orientation="vertical" onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-col h-auto w-full rounded-none border-r bg-muted/40">
                  <TabsTrigger 
                    value="basic" 
                    className="justify-start px-6 py-3 rounded-none data-[state=active]:border-r-2 data-[state=active]:border-primary"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Basic Information
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security" 
                    className="justify-start px-6 py-3 rounded-none data-[state=active]:border-r-2 data-[state=active]:border-primary"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Security & Status
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => setShowPermissionsDialog(true)}
                disabled={user?.status === UserStatus.DELETED}
              >
                <Shield className="h-4 w-4 mr-2" />
                Manage Permissions
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/users/${userId}`)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Main Content Area */}
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="basic" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Edit user's personal details and role</CardDescription>
                    </div>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <UserForm
                    title="Edit User Information"
                    onSubmit={handleUpdateUser}
                    onCancel={() => setActiveTab('basic')}
                    initialData={{
                      name: user?.name || '',
                      email: user?.email || '',
                      role: (user?.role as UserRole) || UserRole.USER,
                      phone: user?.phone || '',
                      profilePicture: user?.profilePicture || ''
                    }}
                    isLoading={isSubmitting}
                    error={null}
                    success={false}
                    showPassword={false}
                    submitLabel="Save Changes"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Security & Status</CardTitle>
                      <CardDescription>Manage account status and security settings</CardDescription>
                    </div>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Account Status Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Account Status</h3>
                      <div className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(user?.status as UserStatus)}`}>
                        Current: {user?.status || 'Unknown'}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant={user?.status === UserStatus.ACTIVE ? 'default' : 'outline'}
                        onClick={() => handleUpdateUser({ status: UserStatus.ACTIVE })}
                        disabled={isSubmitting || user?.status === UserStatus.DELETED || user?.status === UserStatus.ACTIVE}
                        className="flex items-center justify-start px-4 h-auto py-3"
                      >
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Activate Account</div>
                          <div className="text-xs text-muted-foreground">User can log in and access the system</div>
                        </div>
                      </Button>
                      
                      <Button
                        variant={user?.status === UserStatus.INACTIVE ? 'default' : 'outline'}
                        onClick={() => handleUpdateUser({ status: UserStatus.INACTIVE })}
                        disabled={isSubmitting || user?.status === UserStatus.DELETED || user?.status === UserStatus.INACTIVE}
                        className="flex items-center justify-start px-4 h-auto py-3"
                      >
                        <div className="bg-gray-100 p-2 rounded-full mr-3">
                          <AlertTriangle className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Deactivate Account</div>
                          <div className="text-xs text-muted-foreground">User cannot log in but data is preserved</div>
                        </div>
                      </Button>
                      
                      <Button
                        variant={user?.status === UserStatus.SUSPENDED ? 'default' : 'outline'}
                        onClick={() => handleUpdateUser({ status: UserStatus.SUSPENDED })}
                        disabled={isSubmitting || user?.status === UserStatus.DELETED || user?.status === UserStatus.SUSPENDED}
                        className="flex items-center justify-start px-4 h-auto py-3"
                      >
                        <div className="bg-amber-100 p-2 rounded-full mr-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Suspend Account</div>
                          <div className="text-xs text-muted-foreground">Temporary block for security or policy concerns</div>
                        </div>
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={() => handleUpdateUser({ status: UserStatus.DELETED })}
                        disabled={isSubmitting || user?.status === UserStatus.DELETED}
                        className="flex items-center justify-start px-4 h-auto py-3"
                      >
                        <div className="bg-red-100 p-2 rounded-full mr-3">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Delete Account</div>
                          <div className="text-xs">Mark as deleted (data will be preserved)</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Password Management Section */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-semibold">Password Management</h3>
                    <Separator />
                    
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/users/${userId}?resetPassword=true`)}
                      disabled={user?.status === UserStatus.DELETED || isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Reset Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Permissions</DialogTitle>
            <DialogDescription>
              Manage permissions for {user?.name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          {user && (
            <UserPermissionsEnhanced 
              user={user}
              onSave={handleUpdatePermissions}
              onCancel={() => setShowPermissionsDialog(false)}
              readOnly={user.status === UserStatus.DELETED}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
