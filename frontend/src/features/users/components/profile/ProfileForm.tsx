/**
 * ProfileForm.tsx
 * Component for user profile information editing
 */
import React, { useState, useEffect, useRef } from 'react';
import { UserService } from '@/infrastructure/clients/UserService';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Loader2, User, Mail, Phone, Camera, UserCircle } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { useFileUpload } from '@/shared/hooks/useFileUpload';
import { UserDto } from '@/domain/dtos/UserDtos';

interface ProfileFormProps {
  user: UserDto;
  onProfileUpdated?: () => void;
}

export function ProfileForm({ user, onProfileUpdated }: ProfileFormProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    profilePicture: string;
  }>({
    name: '',
    email: '',
    phone: '',
    profilePicture: ''
  });

  // Use the file upload hook
  const { upload, isUploading, error: uploadError } = useFileUpload({
    onSuccess: (result) => {
      if (result.filePath) {
        setFormData(prev => ({ ...prev, profilePicture: result.filePath || '' }));
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
  useEffect(() => {
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
        
        // Refresh the user data
        if (onProfileUpdated) {
          onProfileUpdated();
        }
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
        
        // Notify parent component
        if (onProfileUpdated) {
          onProfileUpdated();
        }
        
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <CardDescription>
            {user.role}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
