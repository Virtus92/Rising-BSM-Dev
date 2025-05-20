/**
 * ProfileForm.tsx
 * Component for user profile information editing
 */
import React, { useState, useEffect, useRef } from 'react';
import { UserService } from '@/features/users/lib/services/UserService';
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
    profilePicture?: string;
    profilePictureId?: string; // Changed from number to string to match UserDto
  }>({
    name: '',
    email: '',
    phone: '',
    profilePicture: '',
    profilePictureId: undefined
  });
  
  // Add validation states
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  // Use the file upload hook
  const { upload, isUploading, error: uploadError } = useFileUpload({
    onSuccess: (result) => {
      // The API might return the file ID in the filePath or as a different property
      // We need to extract it from the response or use an identifier from the path
      const fileIdFromPath = result.filePath ? 
        result.filePath.split('/').pop() || undefined : 
        undefined;
      
      setFormData(prev => ({ 
        ...prev, 
        // Use the appropriate ID source (could be in the file path or result object)
        profilePictureId: fileIdFromPath,
        profilePicture: result.filePath
      }));
      
      // If not in editing mode, directly save the profile picture
      if (!isEditing && fileIdFromPath) {
        handleProfilePictureUpdate(fileIdFromPath, result.filePath || '');
      }
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
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
        profilePicture: user.profilePicture || '',
        profilePictureId: user.profilePictureId
      });
    }
  }, [user]);

  // Handle form input changes with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation errors when user edits a field
    if (name in validationErrors) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Valid email address required';
    }
    
    // Phone validation (optional field)
    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number format';
    }
    
    setValidationErrors(errors);
    
    // Form is valid if there are no errors
    return Object.keys(errors).length === 0;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return; // No file selected
    }
    
    const file = e.target.files[0];
    
    // File validation is handled by the useFileUpload hook
    setIsUploadingImage(true);
    upload(file, 'profilePictures', { userId: user?.id?.toString() || '' })
      .catch(error => {
        console.error('Upload error:', error as Error);
        toast({
          title: "Fehler",
          description: "An error occurred while uploading the profile picture.",
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
  const handleProfilePictureUpdate = async (fileId: string, filePath: string) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Ensure proper path format for profile pictures
      let normalizedPath = filePath;
      if (normalizedPath.includes('/uploads/')) {
        // Fix inconsistent casing in profilePictures path
        if (normalizedPath.toLowerCase().includes('/uploads/profilepictures/') &&
            !normalizedPath.includes('/uploads/profilePictures/')) {
          normalizedPath = normalizedPath.replace(
            /\/uploads\/profilepictures\//i, 
            '/uploads/profilePictures/'
          );
          console.log('Normalized profile picture path:', normalizedPath);
        }
      }
      
      // Retry mechanism for profile picture update
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let lastError = null;
      
      while (attempts < maxAttempts && !success) {
        try {
          // Add delay for retries
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
          
          attempts++;
          console.log(`Updating profile picture (attempt ${attempts}/${maxAttempts})`);
          
          const response = await UserService.updateUser(user.id, {
            profilePictureId: fileId,
            // Keep the profilePicture path for backward compatibility
            profilePicture: normalizedPath
          });

          if (response.success) {
            success = true;
            toast({
              title: "Success",
              description: "Profile picture has been updated.",
              variant: "success"
            });
            
            // Refresh the user data
            if (onProfileUpdated) {
              onProfileUpdated();
            }
          } else {
            throw new Error(response.message || "Could not update profile picture.");
          }
        } catch (error) {
          console.error(`Error updating profile picture (attempt ${attempts}/${maxAttempts}):`, error as Error);
          lastError = error;
          
          // Only show toast on final error
          if (attempts === maxAttempts) {
            toast({
              title: "Fehler",
              description: error instanceof Error ? error.message : "Could not update profile picture.",
              variant: "error"
            });
          }
        }
      }
      
      // If all attempts failed and we didn't show a toast yet
      if (!success && lastError) {
        toast({
          title: "Fehler",
          description: lastError instanceof Error ? lastError.message : "Profilbild konnte nicht aktualisiert werden.",
          variant: "error"
        });
      }
    } catch (error) {
      console.error('Profile picture update failed:', error as Error);
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
    
    // Validate form before submission
    if (!validateForm()) {
      // Show a validation error toast
      toast({
        title: "Validation Error",
        description: "Please check your inputs.",
        variant: "error",
        dedupeKey: "profile-validation-error",
        dedupeStrategy: "replace"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone ? formData.phone.trim() : undefined,
      };
      
      // Only include profile picture fields if they've changed
      if (formData.profilePictureId !== user.profilePictureId) {
        Object.assign(updateData, {
          profilePictureId: formData.profilePictureId,
          // Keep profilePicture for backward compatibility 
          profilePicture: formData.profilePicture
        });
      }
      
      const response = await UserService.updateUser(user.id, updateData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Profile has been updated.",
          variant: "success",
          dedupeKey: "profile-update-success",
          dedupeStrategy: "replace"
        });
        
        // Notify parent component
        if (onProfileUpdated) {
          onProfileUpdated();
        }
        
        setIsEditing(false);
      } else {
        throw new Error(response.message || "Profile could not be updated.");
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Profile could not be updated.",
        variant: "error",
        dedupeKey: "profile-update-error",
        dedupeStrategy: "replace"
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
            Edit Profile
          </Button>
        </CardFooter>
      </Card>

      {/* Profile Details */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            Your personal information and account details
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
                  placeholder="Your full name"
                  className={validationErrors.name ? "border-red-500" : ""}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  value={formData.email} 
                  onChange={handleInputChange}
                  placeholder="Your email address"
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  name="phone"
                  value={formData.phone} 
                  onChange={handleInputChange}
                  placeholder="Your phone number"
                  className={validationErrors.phone ? "border-red-500" : ""}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                )}
              </div>
              <div className="flex space-x-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                    <div>{user.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email Address</div>
                    <div>{user.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone Number</div>
                    <div>{user.phone || 'Not provided'}</div>
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
