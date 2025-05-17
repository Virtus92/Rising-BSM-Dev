'use client';

/**
 * AuthProvider.tsx
 * 
 * Centralized authentication provider that serves as a wrapper around AuthService.
 * Provides authentication state and methods to React components.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService, { AuthState, UserInfo } from '@/features/auth/core/AuthService';
import { getLogger } from '@/core/logging';
import { RegisterDto } from '@/domain/dtos/AuthDtos';

// Logger
const logger = getLogger();

// Interface for the auth context
export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  
  // Standard auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  register: (registerData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  refreshAuth: () => Promise<boolean>;
  
  // Original method names for compatibility
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

// Type for registration data - matches RegisterDto
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  terms?: boolean;
  phone?: string;
  confirmPassword?: string; // Alias for passwordConfirm for backward compatibility
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
  user: null,
  
  // Standard auth actions
  login: async () => ({ success: false }),
  logout: async () => {},
  register: async () => ({ success: false }),
  refreshAuth: async () => false,
  
  // Original method names
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  refreshToken: async () => false,
});

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Auth state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isInitialized: false,
    user: null,
    initializationTime: 0
  });
  
  // Loading state for authentication operations
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize authentication on mount
  useEffect(() => {
    let isMounted = true;
    
    // Only subscribe to auth state changes, don't initialize
    const unsubscribe = AuthService.onAuthStateChange((state: AuthState) => {
      if (isMounted) {
        setAuthState(state);
        setIsLoading(false);
        
        // Only log state changes after initial setup
        if (state.isInitialized) {
          logger.debug('Auth state updated', {
            isAuthenticated: state.isAuthenticated,
            userId: state.user?.id,
          });
        }
      }
    });
    
    // Update initial state once
    const currentState = AuthService.getAuthState();
    setAuthState(currentState);
    setIsLoading(!currentState.isInitialized);
    
    // Clean up
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  
  /**
   * Sign in handler
   */
  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      setIsLoading(false);
      return result;
    } catch (error) {
      logger.error('Sign in error:', error as Error);
      setIsLoading(false);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  };
  
  /**
   * Sign out handler
   */
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
    } catch (error) {
      logger.error('Sign out error:', error as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Register handler
   */
  const handleRegister = async (registerData: RegisterData) => {
    setIsLoading(true);
    try {
      // Convert to RegisterDto format
      const registerDto: RegisterDto = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        passwordConfirm: registerData.passwordConfirm || registerData.confirmPassword,
        terms: registerData.terms,
        phone: registerData.phone
      };
      
      // Call AuthService register method
      const result = await AuthService.register(registerDto);
      
      setIsLoading(false);
      return result;
    } catch (error) {
      logger.error('Registration error:', error as Error);
      setIsLoading(false);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  };
  
  /**
   * Refresh token handler
   */
  const handleRefreshToken = async () => {
    try {
      const result = await AuthService.refreshToken();
      return result.success;
    } catch (error) {
      logger.error('Token refresh error:', error as Error);
      return false;
    }
  };
  
  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        isInitialized: authState.isInitialized,
        isLoading,
        user: authState.user,
        
        // Standard auth actions
        login: handleSignIn,
        logout: handleSignOut,
        register: handleRegister,
        refreshAuth: handleRefreshToken,
        
        // Original method names
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshToken: handleRefreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Default export
export default AuthProvider;
