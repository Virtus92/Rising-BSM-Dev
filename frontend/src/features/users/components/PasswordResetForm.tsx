'use client';

import React, { useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';
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
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { UserService } from '@/infrastructure/clients/UserService';

interface PasswordResetFormProps {
  userId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  userId,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [passwordType, setPasswordType] = useState<'text' | 'password'>('password');
  
  const togglePasswordVisibility = () => {
    setPasswordType(prev => prev === 'password' ? 'text' : 'password');
  };

  // We'll use the secure password generator from the server instead of generating locally

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(false);
    setIsLoading(true);
    
    try {
      // Let the server generate a secure password
      const response = await UserService.resetUserPassword(userId);
      
      if (response.success && response.data?.password) {
        setSuccess(true);
        setGeneratedPassword(response.data.password);
        toast({
          title: "Password Reset Successful",
          description: "The user's password has been reset successfully.",
          variant: "success"
        });
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        alert('Password copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset User Password</CardTitle>
        <CardDescription>
          This will generate a new random password for the user.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-md text-green-800 text-sm">
              Password reset successfully!
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="generatedPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="generatedPassword"
                  type={passwordType}
                  value={generatedPassword || ''}
                  readOnly
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={togglePasswordVisibility}
                >
                  {passwordType === 'password' ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Button 
                onClick={copyToClipboard} 
                className="w-full mt-2"
                variant="outline"
              >
                Copy to Clipboard
              </Button>
              
              <p className="text-xs text-muted-foreground mt-2">
                Make sure to communicate this password securely to the user.
                They will be required to change it on their first login.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Resetting the password will immediately invalidate the current password.
              A new random password will be generated.
            </p>
            
            <div className="flex items-center p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
              <KeyRound className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">
                This action cannot be undone. Please make sure you have a way to communicate 
                the new password to the user.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          {success ? 'Close' : 'Cancel'}
        </Button>
        
        {!success && (
          <Button 
            type="button"
            onClick={handleResetPassword}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : 'Reset Password'}
          </Button>
        )}
        
        {success && (
          <Button 
            type="button"
            onClick={onSuccess}
          >
            Done
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
