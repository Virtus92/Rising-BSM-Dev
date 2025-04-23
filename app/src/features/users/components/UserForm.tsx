'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EntityColors } from '@/shared/utils/entity-colors';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Loader2, Upload, X, User, Mail, Phone, Shield, CheckCircle, LayoutGrid } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { UserDto } from '@/domain/dtos/UserDtos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useFileUpload } from '@/shared/hooks/useFileUpload';

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

export interface UserFormProps {
  initialData?: Partial<UserDto>;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  title: string;
  description?: string;
  submitLabel: string;
  showPassword?: boolean;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  error,
  success,
  title,
  description,
  submitLabel,
  showPassword = false,
  onCancel
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    confirmPassword: '',
    role: initialData?.role as UserRole || UserRole.USER,
    status: initialData?.status as UserStatus || UserStatus.ACTIVE,
    phone: initialData?.phone || '',
    profilePicture: initialData?.profilePicture || '',
    profilePictureId: initialData?.profilePictureId ? Number(initialData.profilePictureId) : undefined
  });

  const [internalError, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.profilePicture || null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Use the file upload hook
  const { upload, isUploading } = useFileUpload({
    onSuccess: (result) => {
      if (result.filePath) {
        setPreviewImage(result.filePath);
        // Use a type assertion to access the fileId property from the API response
        const fileId = (result as any).fileId;
        setFormData(prev => ({ 
          ...prev, 
          profilePicture: result.filePath,
          profilePictureId: fileId ? Number(fileId) : undefined
        }));
        setError(null);
      }
    },
    onError: (error) => {
      setError(error.message);
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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear the file input reference
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation is handled by the useFileUpload hook
    try {
      // Upload the file to the server using our file upload API
      await upload(file, 'profilePictures', {
        userId: initialData?.id?.toString() || 'new'
      });
      
      // The onSuccess callback in useFileUpload will update the form data
      // with the file path and file ID returned from the server
    } catch (error) {
      console.error('Error uploading file:', error);
      // Error handling is done in the useFileUpload hook via onError callback
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    // Revoke previous object URL to prevent memory leaks
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    
    setPreviewImage(null);
    setFormData(prev => ({ 
      ...prev, 
      profilePicture: '',
      profilePictureId: undefined
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data before submission
    const errors = validateForm();
    if (errors.length > 0) {
      // Show validation errors
      setError(errors.join('\n'));
      return;
    }
    
    await onSubmit(formData);
  };
  
  // Validate form fields
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    // Name validation
    if (!formData.name.trim()) {
      errors.push('Name is required.');
    } else if (formData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long.');
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.push('Email is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address.');
    }
    
    // Password validation (only if required or provided)
    if (showPassword || formData.password) {
      if (!formData.password) {
        errors.push('Password is required.');
      } else {
        // Check password length
        if (formData.password.length < 8) {
          errors.push('Password must be at least 8 characters long.');
        }
        
        // Check for uppercase letter
        if (!/[A-Z]/.test(formData.password)) {
          errors.push('Password must contain at least one uppercase letter.');
        }
        
        // Check for lowercase letter
        if (!/[a-z]/.test(formData.password)) {
          errors.push('Password must contain at least one lowercase letter.');
        }
        
        // Check for number
        if (!/[0-9]/.test(formData.password)) {
          errors.push('Password must contain at least one number.');
        }
        
        // Check for special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
          errors.push('Password must contain at least one special character.');
        }
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.push('Passwords do not match.');
      }
    }
    
    return errors;
  };

  return (
    <Card className="w-full border shadow-sm hover:shadow-md transition-all">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 p-3 rounded-md text-green-800 text-sm mb-4">
              Operation completed successfully!
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:w-[400px] mb-4">
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
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
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
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
              
              {showPassword && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                      onChange={handleChange}
                      placeholder="Enter password"
                      required={showPassword}
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
                      onChange={handleChange}
                      placeholder="Confirm password"
                      required={showPassword}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-1.5">
                    <LayoutGrid className="h-3.5 w-3.5 text-blue-600" />
                    Role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange('role', value)}
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
                
                {initialData && (
                  <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                    Status
                  </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={UserStatus.INACTIVE}>Inactive</SelectItem>
                        <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                        {/* System-managed statuses should not be selectable through the UI */}
                        {/* <SelectItem value={UserStatus.DELETED}>Deleted</SelectItem> */}
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
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="space-y-2 mt-4">
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
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
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

              <div className="space-y-2 mt-4">
                <Label htmlFor="profilePicture" className="flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-blue-600" />
                  Or Image URL (Optional)
                </Label>
                <Input
                  id="profilePicture"
                  name="profilePicture"
                  value={formData.profilePicture || ''}
                  onChange={handleChange}
                  placeholder="Enter profile picture URL"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className={EntityColors.users.text}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
            className={EntityColors.users.primary}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
