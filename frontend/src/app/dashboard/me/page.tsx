'use client';

import React, { useState } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { UserCircle, Mail, Phone, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

export default function UserProfilePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // When user data is loaded, initialize the form
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // This would be implemented when the backend supports profile updates
    toast({
      title: "Info",
      description: "Die Funktion zum Aktualisieren des Profils ist noch nicht verfügbar.",
      variant: "default"
    });
    
    setIsEditing(false);
  };

  // Format date as a string in locale format
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Nicht verfügbar';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profilkarte */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserCircle className="w-16 h-16 text-primary" />
              )}
            </div>
            <CardTitle className="mt-4">{user.name}</CardTitle>
            <CardDescription className={statusInfo.color}>
              {statusInfo.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Mitglied seit {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
              Profil bearbeiten
            </Button>
          </CardFooter>
        </Card>

        {/* Profildetails */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profildetails</CardTitle>
            <CardDescription>
              Ihre persönlichen Informationen und Kontodetails
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    name="name"
                    value={formData.name} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    value={formData.email} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    value={formData.phone} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button type="submit">Speichern</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Abbrechen
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Persönliche Informationen</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Vollständiger Name</div>
                      <div>{user.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">E-Mail-Adresse</div>
                      <div>{user.email}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Telefonnummer</div>
                      <div>{user.phone || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold">Kontodetails</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Rolle</div>
                      <div>{getRoleName(user.role)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <div className={statusInfo.color}>{statusInfo.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Mitglied seit</div>
                      <div>{formatDate(user.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Zuletzt aktualisiert</div>
                      <div>{formatDate(user.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
