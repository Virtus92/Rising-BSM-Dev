'use client';

import React, { useState } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { AlertCircle, UserCircle, Shield, Settings, BellRing, Clock } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ProfileForm, PasswordChangeForm } from '@/features/users/components/profile';
import { formatDate } from '@/shared/utils/date-utils';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

export default function UserProfilePage() {
  const { user, isLoading, refreshAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Helper function to get role display name
  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.USER:
        return 'Benutzer';
      default:
        return 'Unbekannt';
    }
  };

  // Helper function to get status display name and color
  const getStatusInfo = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return { name: 'Aktiv', color: 'text-green-500' };
      case UserStatus.INACTIVE:
        return { name: 'Inaktiv', color: 'text-gray-500' };
      case UserStatus.SUSPENDED:
        return { name: 'Gesperrt', color: 'text-orange-500' };
      default:
        return { name: 'Unbekannt', color: 'text-gray-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Nicht angemeldet</h2>
        <p className="text-muted-foreground text-center mb-6">
          Sie müssen angemeldet sein, um Ihr Profil anzuzeigen.
        </p>
        <Button onClick={() => window.location.href = '/auth/login'}>
          Zum Login
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(user.status);

  return (
    <div className="container max-w-4xl py-6">
      <h1 className="text-3xl font-bold mb-6">Mein Profil</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Sicherheit</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Konto</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileForm user={user} onProfileUpdated={refreshAuth} />
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
                Kontodetails
              </CardTitle>
              <CardDescription>
                Details zu Ihrem Konto und Status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Kontoübersicht</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Rolle</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="h-4 w-4 text-primary" />
                      {getRoleName(user.role)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <div className={`mt-1 ${statusInfo.color}`}>{statusInfo.name}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Mitglied seit</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Zuletzt aktualisiert</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDate(user.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold">Benachrichtigungen</h3>
                <div className="mt-4">
                  <p className="text-muted-foreground">
                    Benachrichtigungseinstellungen können in den Systemeinstellungen angepasst werden.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.href = '/dashboard/settings'}
                  >
                    <BellRing className="mr-2 h-4 w-4" />
                    Zu den Einstellungen
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
