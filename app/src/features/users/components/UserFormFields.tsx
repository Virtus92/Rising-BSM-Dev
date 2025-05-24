'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { useFileUpload } from '@/shared/hooks/useFileUpload';
import { User, Mail, Phone, Shield, CheckCircle, LayoutGrid, Upload, X, Loader2 } from 'lucide-react';

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  profilePicture?: string;
  profilePictureId?: number;
}

export interface UserFormFieldsProps {
  formData: UserFormData;
  onChange: (data: Partial<UserFormData>) => void;
  showPassword?: boolean;
  showStatus?: boolean;
  errors?: string[];
  disabled?: boolean;
}

/**
 * Pure form fields component without any wrapper
 * For use in modals and other contexts where Card wrapper is not needed
 */
export const UserFormFields: React.FC<UserFormFieldsProps> = ({
  formData,
  onChange,
  showPassword = false,
  showStatus = false,
  errors = [],
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(formData.profilePicture || null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Use the file upload hook
  const { upload, isUploading } = useFileUpload({
    onSuccess: (result) => {
      if (result.filePath) {
        setPreviewImage(result.filePath);
        const resultObj = result as Record<string, any>;
        const fileId = resultObj.fileId || null;
        onChange({ 
          profilePicture: result.filePath,
          profilePictureId: fileId ? Number(fileId) : undefined
        });
        setInternalError(null);
      }
    },
    onError: (error) => {
      setInternalError(error.message);
    },
    showToasts: true,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 2 * 1024 * 1024 // 2MB
  });

  // Clean up object URL when component unmounts or when a new image is selected
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const handleChange = (field: keyof UserFormData, value: any) => {
    onChange({ [field]: value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await upload(file, 'profilePictures', {
        userId: 'new'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    
    setPreviewImage(null);
    onChange({ 
      profilePicture: '',
      profilePictureId: undefined
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Display errors if any */}
      {errors.length > 0 && (
        <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}

      {internalError && (
        <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
          {internalError}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="additional">Additional Info</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" />
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter full name"
                required
                disabled={disabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter email address"
                required
                disabled={disabled}
              />
            </div>
          </div>
          
          {showPassword && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-600" />
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Enter password"
                  required={showPassword}
                  disabled={disabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword || ''}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                  required={showPassword}
                  disabled={disabled}
                />
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5 text-blue-600" />
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                  <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                  <SelectItem value={UserRole.USER}>User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {showStatus && (
              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={UserStatus.INACTIVE}>Inactive</SelectItem>
                    <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="additional" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              Phone Number (Optional)
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-blue-600" />
              Profile Picture (Optional)
            </Label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full border flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                {previewImage ? (
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isUploading || disabled}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || disabled}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || disabled}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </>
                    )}
                  </Button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: Square image, at least 300x300px
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profilePicture" className="flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-blue-600" />
              Or Image URL (Optional)
            </Label>
            <Input
              id="profilePicture"
              name="profilePicture"
              value={formData.profilePicture || ''}
              onChange={(e) => handleChange('profilePicture', e.target.value)}
              placeholder="Enter profile picture URL"
              disabled={disabled}
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};
