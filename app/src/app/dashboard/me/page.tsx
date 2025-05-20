'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { AlertCircle, UserCircle, Shield, Settings, BellRing, Clock } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ProfileForm, PasswordChangeForm } from '@/features/users/components/profile';
import { formatDate } from '@/shared/utils/date-utils';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { getItem, setItem } from '@/shared/utils/storage/cookieStorage';

export default function UserProfilePage() {
  const { user, isLoading, refreshToken } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Helper function to get role display name
  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.USER:
        return 'User';
      default:
        return 'Unknown';
    }
  };

  // Helper function to get status display name and color
  const getStatusInfo = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return { name: 'Active', color: 'text-green-500' };
      case UserStatus.INACTIVE:
        return { name: 'Inactive', color: 'text-gray-500' };
      case UserStatus.SUSPENDED:
        return { name: 'Suspended', color: 'text-orange-500' };
      default:
        return { name: 'Unknown', color: 'text-gray-500' };
    }
  };

  const [loadingState, setLoadingState] = useState<'initial' | 'loaded' | 'error'>('initial');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Handle loading and error states with timeout detection and local storage caching
  useEffect(() => {
    if (isLoading) {
      // Try to use cached user data during loading to prevent showing spinner
      try {
        const cachedUserData = getItem('user_profile_cache');
        const cacheTimestamp = getItem('user_profile_cache_timestamp');
        
        if (cachedUserData && cacheTimestamp) {
          const timestamp = parseInt(cacheTimestamp, 10);
          const now = Date.now();
          
          // Use cached data if less than 30 minutes old
          if (!isNaN(timestamp) && now - timestamp < 30 * 60 * 1000) {
            const userData = JSON.parse(cachedUserData);
            // Only use if it has basic required fields
            if (userData && userData.id && userData.email) {
              console.log('Using cached user profile data during load');
              setLoadingState('loaded');
            }
          }
        }
      } catch (e) {
        console.warn('Error accessing cached user data:', e);
      }
      
      // Set a timeout for loading - if it takes too long, show an error
      // but with increased timeout (30s instead of 15s)
      const timeoutId = setTimeout(() => {
        if (loadingState === 'initial') {
          setLoadError('Loading timed out. The server might be unavailable.');
          setLoadingState('error');
        }
      }, 30000); // 30 seconds timeout
      
      return () => clearTimeout(timeoutId);
    } else {
      // When loading completes
      setLoadingState('loaded');
      
      // Cache the user data for future use
      if (user) {
        try {
          setItem('user_profile_cache', JSON.stringify(user));
          setItem('user_profile_cache_timestamp', Date.now().toString());
        } catch (e) {
          console.warn('Error caching user data:', e);
        }
      }
    }
  }, [isLoading, loadingState, user]);
  
  // Retry handler for timeout errors
  const handleRetry = useCallback(() => {
    setLoadingState('initial');
    setLoadError(null);
    refreshToken();
  }, [refreshToken]);
  
  if (isLoading && loadingState === 'initial') {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading profile data...</p>
      </div>
    );
  }
  
  if (loadingState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Profile</h2>
        <p className="text-muted-foreground text-center mb-6">
          {loadError || 'Failed to load profile data. Please try again later.'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/auth/login'}>
            Go to Login
          </Button>
          <Button onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not Logged In</h2>
        <p className="text-muted-foreground text-center mb-6">
          You must be logged in to view your profile.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.href = '/auth/login'}>
            Go to Login
          </Button>
          <Button variant="outline" onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(user.status as UserStatus);

  return (
    <div className="container max-w-4xl py-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
        </TabsList>        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {user && (
            <ProfileForm 
              user={{
                id: user.id,
                email: user.email,
                name: user.name || 'Unnamed User',
                role: user.role as UserRole || UserRole.USER,
                status: user.status as UserStatus || UserStatus.ACTIVE,
                phone: user.phone,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt || new Date().toISOString(),
                updatedAt: user.updatedAt || new Date().toISOString()
              }} 
              onProfileUpdated={refreshToken} 
            />
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <PasswordChangeForm onPasswordChanged={() => {}} />
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Account Details
              </CardTitle>
              <CardDescription>
                Details about your account and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Account Overview</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Role</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="h-4 w-4 text-primary" />
                      {getRoleName(user.role as UserRole)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <div className={`mt-1 ${statusInfo.color}`}>{statusInfo.name}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Member Since</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDate(user.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold">Notifications</h3>
                <div className="mt-4">
                  <p className="text-muted-foreground">
                    Notification settings can be adjusted in the system settings.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.href = '/dashboard/settings'}
                  >
                    <BellRing className="mr-2 h-4 w-4" />
                    Go to Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
