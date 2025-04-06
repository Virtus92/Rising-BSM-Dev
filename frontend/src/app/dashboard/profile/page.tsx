'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, User, Mail, Phone, Key, Camera, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
      
      // Set profile image if available
      if (user.profileImage) {
        setProfileImage(user.profileImage);
      }
      
      setLoading(false);
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    try {
      setUploadingImage(true);
      
      // Create a URL for the selected image to display immediately
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
      
      // TODO: Implement API call to save the image
      // Simulating API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile picture updated');
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Handle removing profile image
  const handleRemoveImage = async () => {
    try {
      setUploadingImage(true);
      
      // TODO: Implement API call to remove the image
      // Simulating API call for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProfileImage(null);
      toast.success('Profile picture removed');
    } catch (err) {
      console.error('Error removing image:', err);
      toast.error('Failed to remove image');
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    // Validate data
    if (!formData.name.trim()) {
      setError('Name is required');
      setIsSaving(false);
      return;
    }
    
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required');
      setIsSaving(false);
      return;
    }
    
    try {
      // TODO: Implement actual API call to update profile
      // Include profile image in the payload
      const profileData = {
        ...formData,
        profileImage: profileImage
      };
      
      // Simulate API call
      await new Promise(r => setTimeout(r, 500));
      
      // Update user context
      // Here we would typically update the user context with the new profile data
      
      toast.success('Profile information updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile information');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setIsSaving(false);
      return;
    }
    
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsSaving(false);
      return;
    }
    
    try {
      // TODO: Implement actual API call to change password
      // For now, just show success message
      await new Promise(r => setTimeout(r, 500)); // Simulate API call
      toast.success('Password changed successfully');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Loading profile...</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile Settings</h1>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-1 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-500' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'} font-medium text-sm`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-4 px-1 ${activeTab === 'password' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-500' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'} font-medium text-sm`}
          >
            Change Password
          </button>
        </nav>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Profile" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={64} className="text-gray-400 dark:text-gray-600" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0">
                      {uploadingImage ? (
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center animate-pulse">
                          <span className="animate-spin h-4 w-4 border-2 border-blue-500 dark:border-blue-400 rounded-full border-t-transparent"></span>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                        >
                          <Camera size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div className="flex justify-center space-x-2">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                    >
                      Change Photo
                    </button>
                    {profileImage && (
                      <button 
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 flex items-center"
                      >
                        <Trash2 size={12} className="mr-1" /> Remove
                      </button>
                    )}
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="flex items-center">
                    <Mail size={16} className="text-gray-400 mr-2" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <div className="flex items-center">
                    <Phone size={16} className="text-gray-400 mr-2" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <div className="flex items-center">
                  <Key size={16} className="text-gray-400 mr-2" />
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div className="flex items-center">
                  <Key size={16} className="text-gray-400 mr-2" />
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    required
                    minLength={8}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters long
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div className="flex items-center">
                  <Key size={16} className="text-gray-400 mr-2" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
