/**
 * PasswordChangeForm.tsx
 * Standalone component for changing passwords with enhanced UI and validation
 */
import React, { useState, useEffect, useCallback } from 'react';
import { UserService } from '@/features/users/lib/services/UserService';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Loader2, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { validatePasswordStrength, getPasswordValidationDetails, generateSecurePassword } from '@/core/security/validation/password-validation';

interface PasswordChangeFormProps {
  onPasswordChanged?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function PasswordChangeForm({ onPasswordChanged, onCancel, compact = false }: PasswordChangeFormProps) {
  const { toast } = useToast();
  
  // We're using the toast hook directly for notifications
  // No need for a separate showToast function that would cause duplicates
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // UI state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changingPasswordError, setChangingPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    hasSpecialChar: false,
    isValid: false,
    passwordsMatch: true
  });
  
  // Update password validation state when password changes
  useEffect(() => {
    if (!passwordData.newPassword) {
      setPasswordValidation({
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasDigit: false,
        hasSpecialChar: false,
        isValid: false,
        passwordsMatch: true
      });
      return;
    }

    const validationDetails = getPasswordValidationDetails(passwordData.newPassword);
    
    // Check if passwords match
    const passwordsMatch = !passwordData.confirmPassword || 
                         passwordData.newPassword === passwordData.confirmPassword;
    
    setPasswordValidation(prev => ({
      ...prev,
      ...validationDetails,
      passwordsMatch
    }));
  }, [passwordData.newPassword, passwordData.confirmPassword]);

  // Handle form input changes
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing again
    if (changingPasswordError) {
      setChangingPasswordError(null);
    }
  };
  
  // Generate a secure password
  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setPasswordData(prev => ({
      ...prev,
      newPassword,
      confirmPassword: newPassword
    }));
    
    // Show the toast first, then update state
    toast({
      title: "Password generated",
      description: "A secure password has been generated. Please save it in a secure location.",
      variant: "success",
      dedupeKey: "password-generated",
      dedupeStrategy: "replace"
    });
    
    // Brief delay to ensure toast appears before state changes
    setTimeout(() => {
      // Show the passwords when auto-generating
      setShowNewPassword(true);
      setShowConfirmPassword(true);
    }, 50);
  };
  
  // Submit password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setChangingPasswordError('Passwords do not match');
      return;
    }
    
    if (!validatePasswordStrength(passwordData.newPassword)) {
      setChangingPasswordError('The new password does not meet security requirements');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      setChangingPasswordError(null);
      
      const response = await UserService.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      
      if (response.success) {
        // First show the toast BEFORE resetting anything
        toast({
          title: "Success",
          description: "Password has been successfully changed",
          variant: "success",
          dedupeKey: "password-change-success",
          dedupeStrategy: "replace"
        });
        
        // Add a small delay before resetting the form to ensure the toast is visible
        setTimeout(() => {
          // Reset form
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          
          // Call callback if provided
          if (onPasswordChanged) {
            onPasswordChanged();
          }
        }, 100);
      } else {
        throw new Error(response.message || "Error changing password");
      }
    } catch (error) {
      console.error('Failed to change password:', error as Error);
      // First show the error toast
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Password could not be changed",
        variant: "destructive",
        dedupeKey: "password-change-error",
        dedupeStrategy: "replace"
      });
      
      // Then set the error message in the UI
      setChangingPasswordError(
        error instanceof Error ? error.message : "Passwort konnte nicht geändert werden"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Helper function to calculate password strength percentage
  const getPasswordStrengthPercentage = (): number => {
    const {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasDigit,
      hasSpecialChar
    } = passwordValidation;
    
    // Count how many criteria are met
    const criteriaCount = [
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasDigit,
      hasSpecialChar
    ].filter(Boolean).length;
    
    // Calculate percentage (0-100)
    return Math.max(0, Math.min(100, (criteriaCount / 5) * 100));
  };
  
  // Helper function to get color class based on password strength
  const getPasswordStrengthColor = (): string => {
    const percentage = getPasswordStrengthPercentage();
    
    if (percentage < 40) return 'bg-red-500'; // Weak
    if (percentage < 70) return 'bg-yellow-500'; // Medium
    if (percentage < 100) return 'bg-orange-500'; // Strong
    return 'bg-green-500'; // Very strong
  };
  
  // Helper function to get password strength text
  const getPasswordStrengthText = (): { text: string; color: string } => {
    const percentage = getPasswordStrengthPercentage();
    
    if (percentage < 40) return { text: 'Weak', color: 'text-red-500' };
    if (percentage < 70) return { text: 'Medium', color: 'text-yellow-500' };
    if (percentage < 100) return { text: 'Strong', color: 'text-orange-500' };
    return { text: 'Very strong', color: 'text-green-500' };
  };
  
  // If compact mode, render just the form content
  if (compact) {
    return (
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="flex items-center justify-between">
            <span>Current Password</span>
            </Label>
            <div className="relative">
              <Input 
                id="currentPassword" 
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"} 
                value={passwordData.currentPassword} 
                onChange={handlePasswordInputChange}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="flex items-center justify-between">
            <span>New Password</span>
              {passwordData.newPassword && (
                <span className={`text-xs font-medium ${getPasswordStrengthText().color}`}>
                  {getPasswordStrengthText().text}
                </span>
              )}
            </Label>
            <div className="relative">
              <Input 
                id="newPassword" 
                name="newPassword"
                type={showNewPassword ? "text" : "password"} 
                value={passwordData.newPassword} 
                onChange={handlePasswordInputChange}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Password validation indicators */}
          {passwordData.newPassword && (
            <div className="space-y-2 rounded-md bg-muted p-3">
              <div className="text-sm font-medium">Passwort-Anforderungen:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                <div className={`flex items-center ${passwordValidation.hasMinLength ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValidation.hasMinLength ? '✓' : '○'}</span> Mindestens 8 Zeichen
                </div>
                <div className={`flex items-center ${passwordValidation.hasUppercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValidation.hasUppercase ? '✓' : '○'}</span> Großbuchstabe
                </div>
                <div className={`flex items-center ${passwordValidation.hasLowercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValidation.hasLowercase ? '✓' : '○'}</span> Kleinbuchstabe
                </div>
                <div className={`flex items-center ${passwordValidation.hasDigit ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValidation.hasDigit ? '✓' : '○'}</span> Ziffer
                </div>
                <div className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValidation.hasSpecialChar ? '✓' : '○'}</span> Sonderzeichen (!@#$%^&*)
                </div>
              </div>
              
              {/* Password strength bar */}
              <div className="mt-2">
                <div className="text-sm font-medium mb-1">Passwort-Stärke:</div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getPasswordStrengthColor()}`}
                    style={{ width: `${getPasswordStrengthPercentage()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <div className="relative">
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"} 
                value={passwordData.confirmPassword} 
                onChange={handlePasswordInputChange}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            
            {/* Passwords match indicator */}
            {passwordData.confirmPassword && (
              <div className={`mt-1 text-sm ${passwordValidation.passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                {passwordValidation.passwordsMatch 
                  ? 'Passwords match ✓' 
                  : 'Passwords do not match ✗'}
              </div>
            )}
          </div>
        </div>
        
        {/* Error message */}
        {changingPasswordError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">{changingPasswordError}</div>
          </div>
        )}
        
        {/* Form actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
          <div className="flex-1 order-2 sm:order-1">
            <Button 
              type="button"
              variant="outline" 
              className="w-full mb-2 sm:mb-0"
              onClick={handleGeneratePassword}
              disabled={isChangingPassword}
            >
              Sicheres Passwort generieren
            </Button>
          </div>
          
          <div className="flex space-x-2 order-1 sm:order-2">
            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              disabled={isChangingPassword || !passwordValidation.isValid || !passwordValidation.passwordsMatch || !passwordData.currentPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Change Password'}
            </Button>
            
            {onCancel && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onCancel}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </form>
    );
  }
  
  // Otherwise render with the card wrapper
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        Change Password
        </CardTitle>
        <CardDescription>
        Update your password to enhance your account security
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="flex items-center justify-between">
                <span>Aktuelles Passwort</span>
              </Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  name="currentPassword"
                  type={showCurrentPassword ? "text" : "password"} 
                  value={passwordData.currentPassword} 
                  onChange={handlePasswordInputChange}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="flex items-center justify-between">
                <span>Neues Passwort</span>
                {passwordData.newPassword && (
                  <span className={`text-xs font-medium ${getPasswordStrengthText().color}`}>
                    {getPasswordStrengthText().text}
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"} 
                  value={passwordData.newPassword} 
                  onChange={handlePasswordInputChange}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Password validation indicators */}
            {passwordData.newPassword && (
              <div className="space-y-2 rounded-md bg-muted p-3">
                <div className="text-sm font-medium">Passwort-Anforderungen:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                  <div className={`flex items-center ${passwordValidation.hasMinLength ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.hasMinLength ? '✓' : '○'}</span> Mindestens 8 Zeichen
                  </div>
                  <div className={`flex items-center ${passwordValidation.hasUppercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.hasUppercase ? '✓' : '○'}</span> Großbuchstabe
                  </div>
                  <div className={`flex items-center ${passwordValidation.hasLowercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.hasLowercase ? '✓' : '○'}</span> Kleinbuchstabe
                  </div>
                  <div className={`flex items-center ${passwordValidation.hasDigit ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.hasDigit ? '✓' : '○'}</span> Ziffer
                  </div>
                  <div className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.hasSpecialChar ? '✓' : '○'}</span> Sonderzeichen (!@#$%^&*)
                  </div>
                </div>
                
                {/* Password strength bar */}
                <div className="mt-2">
                  <div className="text-sm font-medium mb-1">Passwort-Stärke:</div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getPasswordStrengthColor()}`}
                      style={{ width: `${getPasswordStrengthPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"} 
                  value={passwordData.confirmPassword} 
                  onChange={handlePasswordInputChange}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              
              {/* Passwords match indicator */}
              {passwordData.confirmPassword && (
                <div className={`mt-1 text-sm ${passwordValidation.passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                  {passwordValidation.passwordsMatch 
                    ? 'Passwörter stimmen überein ✓' 
                    : 'Passwörter stimmen nicht überein ✗'}
                </div>
              )}
            </div>
          </div>
          
          {/* Error message */}
          {changingPasswordError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{changingPasswordError}</div>
            </div>
          )}
          
          {/* Form actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
            <div className="flex-1 order-2 sm:order-1">
              <Button 
                type="button"
                variant="outline" 
                className="w-full mb-2 sm:mb-0"
                onClick={handleGeneratePassword}
                disabled={isChangingPassword}
              >
                Generate Secure Password
              </Button>
            </div>
            
            <div className="flex space-x-2 order-1 sm:order-2">
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
                disabled={isChangingPassword || !passwordValidation.isValid || !passwordValidation.passwordsMatch || !passwordData.currentPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : 'Passwort ändern'}
              </Button>
              
              {onCancel && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onCancel}
                  disabled={isChangingPassword}
                >
                  Abbrechen
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
