import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, RegisterData } from '@/features/auth/providers/AuthProvider';
import AuthService from '@/features/auth/core/AuthService';
import { useToast } from '@/shared/hooks/useToast';

type ForgotPasswordData = {
  email: string;
};

type ResetPasswordData = {
  token: string;
  password: string;
  confirmPassword: string;
};

// We'll use RegisterFormData from AuthProvider instead of this local type
// This ensures type consistency

type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

/**
 * Hook for auth management functions
 * Uses the new clean authentication service
 */
export function useAuthManagement() {
  const { login: authLogin, logout: authLogout, register: authRegister } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Login function
   */
  const login = useCallback(async (email: string, password: string, remember: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.signIn(email, password);
      if (!result.success) {
        throw new Error(result.message || 'Login failed');
      }
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [authLogin]);
  
  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      await AuthService.signOut();
      
      toast({
        title: 'Successfully logged out',
        description: 'You have been logged out.',
        variant: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      
      toast({
        title: 'Logout error',
        description: 'Please try again.',
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [authLogout, toast]);
  
  /**
   * Forgot password function
   */
  const forgotPassword = useCallback(async ({ email }: ForgotPasswordData) => {
    setLoading(true);
    setError(null);
    
    try {
      // This would call the forgot password API
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Email sent',
          description: 'Password reset instructions have been sent to your email.',
          variant: 'success'
        });
        return true;
      } else {
        throw new Error(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      setError(message);
      
      toast({
        title: 'Error',
        description: message,
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Validate reset token function
   */
  const validateResetToken = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      return data.success;
    } catch (error) {
      console.error('Token validation error:', error);
      setError('Failed to validate token');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Reset password function
   */
  const resetPassword = useCallback(async ({ token, password, confirmPassword }: ResetPasswordData) => {
    setLoading(true);
    setError(null);
    
    try {
      // This would call the reset password API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Password reset',
          description: 'Your password has been reset successfully.',
          variant: 'success'
        });
        
        router.push('/auth/login');
        return true;
      } else {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      setError(message);
      
      toast({
        title: 'Error',
        description: message,
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [router, toast]);
  
  /**
   * Register function
   */
  const register = useCallback(async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Log the userData for debugging
      console.log('Registration payload:', userData);
      
      // Call the register API endpoint directly
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created. You can now log in.',
        variant: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      
      toast({
        title: 'Error',
        description: message,
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [authRegister, toast]);
  
  /**
   * Change password function
   */
  const changePassword = useCallback(async ({ currentPassword, newPassword, newPasswordConfirm }: ChangePasswordData) => {
    setLoading(true);
    setError(null);
    
    try {
      // This would call the change password API
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirm }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Password changed',
          description: 'Your password has been changed successfully.',
          variant: 'success'
        });
        return true;
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to change password';
      setError(message);
      
      toast({
        title: 'Error',
        description: message,
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  return {
    loading,
    error,
    login,
    logout,
    forgotPassword,
    resetPassword,
    register,
    changePassword,
    validateResetToken,
    clearError: () => setError(null)
  };
}
