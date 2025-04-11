'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { UserCircle, Mail, Phone, Calendar, AlertCircle, Upload, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { useFileUpload } from '@/shared/hooks/useFileUpload';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { UserService } from '@/infrastructure/clients/UserService';

export default function UserProfilePage() {
  const { user, isLoading, refreshAuth } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changingPasswordError, setChangingPasswordError] = useState<string | null>(null);

  // Use the file upload hook
  const { upload, isUploading, error: uploadError } = useFileUpload({
    onSuccess: (result) => {
      if (result.filePath) {
        setFormData(prev => ({ ...prev, profilePicture: result.filePath }));
        // If not in editing mode, directly save the profile picture
        if (!isEditing) {
          handleProfilePictureUpdate(result.filePath);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Upload fehlgeschlagen",
        description: error.message,
        variant: "error"
      });
    },
    showToasts: true,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  // When user data is loaded, initialize the form
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        profilePicture: user.profilePicture || ''
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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return; // No file selected
    }
    
    const file = e.target.files[0];
    
    // Validate file size and type before uploading
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fehler",
        description: "Die Datei ist zu groß. Maximale Größe: 5MB.",
        variant: "error"
      });
      return;
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Fehler",
        description: "Ungültiges Dateiformat. Erlaubte Formate: JPG, PNG, WEBP.",
        variant: "error"
      });
      return;
    }
    
    setIsUploadingImage(true);
    upload(file, 'profilePictures', { userId: user?.id?.toString() || '' })
      .catch(error => {
        console.error('Upload error:', error);
        toast({
          title: "Fehler",
          description: "Beim Hochladen des Profilbilds ist ein Fehler aufgetreten.",
          variant: "error"
        });
      })
      .finally(() => {
        setIsUploadingImage(false);
      });
  };

  // Trigger file input click
  const handleProfilePictureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle profile picture update specifically
  const handleProfilePictureUpdate = async (profilePicturePath: string) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      const response = await UserService.updateUser(user.id, {
        profilePicture: profilePicturePath
      });

      if (response.success) {
        toast({
          title: "Erfolg",
          description: "Profilbild wurde aktualisiert.",
          variant: "success"
        });
        
        // Refresh the user data to get the updated profile picture
        await refreshAuth();
      } else {
        throw new Error(response.message || "Profilbild konnte nicht aktualisiert werden.");
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Profilbild konnte nicht aktualisiert werden.",
        variant: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit form data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const response = await UserService.updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        profilePicture: formData.profilePicture
      });

      if (response.success) {
        toast({
          title: "Erfolg",
          description: "Profil wurde aktualisiert.",
          variant: "success"
        });
        
        // Refresh the user data to get the latest updates
        await refreshAuth();
        setIsEditing(false);
      } else {
        throw new Error(response.message || "Profil konnte nicht aktualisiert werden.");
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Profil konnte nicht aktualisiert werden.",
        variant: "error"
      });
    } finally {
      setIsSaving(false);
    }
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setChangingPasswordError('Passwörter stimmen nicht überein');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setChangingPasswordError('Das neue Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      setChangingPasswordError(null);
      
      const response = await UserService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        toast({
          title: "Erfolg",
          description: "Passwort wurde erfolgreich geändert",
          variant: "success"
        });
        
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Close password change form
        setIsChangingPassword(false);
      } else {
        throw new Error(response.message || "Fehler beim Ändern des Passworts");
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      setChangingPasswordError(
        error instanceof Error ? error.message : "Passwort konnte nicht geändert werden"
      );
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Passwort konnte nicht geändert werden",
        variant: "error"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <div className="container max-w-4xl py-6">
      <h1 className="text-3xl font-bold mb-6">Mein Profil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
            />
            
            {/* Profile Picture with upload capability */}
            <div 
              className="relative w-28 h-28 mx-auto cursor-pointer group"
              onClick={handleProfilePictureClick}
            >
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-20 h-20 text-primary" />
                )}
              </div>
              
              {/* Upload overlay */}
              {isUploadingImage || isSaving ? (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
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
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setIsEditing(true)}
              disabled={isSaving || isUploadingImage}
            >
              Profil bearbeiten
            </Button>
          </CardFooter>
        </Card>

        {/* Profile Details */}
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
                    placeholder="Ihr vollständiger Name"
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
                    placeholder="Ihre E-Mail-Adresse"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    value={formData.phone} 
                    onChange={handleInputChange}
                    placeholder="Ihre Telefonnummer"
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Speichern...
                      </>
                    ) : 'Speichern'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
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
      
      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle>Passwort ändern</CardTitle>
          <CardDescription>
            Aktualisieren Sie Ihr Passwort, um Ihre Kontosicherheit zu verbessern
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isChangingPassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                <Input 
                  id="currentPassword" 
                  name="currentPassword"
                  type="password" 
                  value={passwordData.currentPassword} 
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input 
                  id="newPassword" 
                  name="newPassword"
                  type="password" 
                  value={passwordData.newPassword} 
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword"
                  type="password" 
                  value={passwordData.confirmPassword} 
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
              
              {changingPasswordError && (
                <div className="text-red-500 text-sm">
                  {changingPasswordError}
                </div>
              )}
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : 'Passwort ändern'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsChangingPassword(false);
                    setChangingPasswordError(null);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  disabled={isSaving}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <Button
                onClick={() => setIsChangingPassword(true)}
                variant="outline"
              >
                Passwort ändern
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
