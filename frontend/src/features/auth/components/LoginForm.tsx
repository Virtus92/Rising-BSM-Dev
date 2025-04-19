'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/hooks/useToast';
import { AlertCircle } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  // We're using the toast hook directly for notifications
  // No need for a separate showToast function that would cause duplicates
  
  // Reset the error message when inputs change
  useEffect(() => {
    setErrorMessage(null);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setErrorMessage(null);
    
    console.log('LoginForm: Starting login process');
    
    // Simple validation
    if (!email || !password) {
      console.log('LoginForm: Validation failed - missing email or password');
      setErrorMessage('Email and password are required');
      return;
    }
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('LoginForm: Already submitting, ignoring repeat submission');
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log('LoginForm: Attempting login with:', { 
        email, 
        passwordLength: password.length 
      });
      
      // Add additional debugging
      console.log('LoginForm: Before login call');
      
      // Login using the auth context - let AuthProvider handle navigation
      await login({ email, password });
      
      console.log('LoginForm: Login completed successfully');
      
          // First display the success toast - using a deduplication key to prevent duplicates
      toast({
        title: 'Anmeldung erfolgreich',
        description: 'Sie werden zum Dashboard weitergeleitet...',
        variant: 'success',
        dedupeKey: 'login-success',
        dedupeStrategy: 'replace'
      });
      
      // Then reset form (with slight delay to ensure toast is visible)
      setTimeout(() => {
        setEmail('');
        setPassword('');
        formRef.current?.reset();
      }, 100);
      
      // Do NOT navigate here - let AuthProvider handle it
    } catch (error) {
      // Detailed error logging
      console.error('LoginForm Error:', error);
      
      // Clear submission state immediately to allow retry
      setIsSubmitting(false);
      
      if (error instanceof Error) {
        console.error('LoginForm Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Set friendly error messages in German
        if (error.message.includes('401') || 
            error.message.toLowerCase().includes('invalid') ||
            error.message.toLowerCase().includes('ungültig')) {
          setErrorMessage('Ungültige E-Mail oder Passwort');
          
          // For authentication errors, don't show a toast since we already have an inline message
        } else if (error.message.includes('profile')) {
          setErrorMessage('Anmeldung erfolgreich, konnte aber Benutzerprofil nicht laden');
          
          // Show toast for profile issues as they're more serious
          toast({
            title: 'Profilfehler',
            description: 'Anmeldung erfolgreich, konnte aber Benutzerprofil nicht laden',
            variant: 'destructive',
            dedupeKey: 'login-profile-error',
            dedupeStrategy: 'replace'
          });
        } else if (error.message.includes('not active')) {
          setErrorMessage('Ihr Konto ist nicht aktiv. Bitte kontaktieren Sie den Administrator.');
          
          // Show toast for account status issues
          toast({
            title: 'Konto inaktiv',
            description: 'Ihr Konto ist nicht aktiv. Bitte kontaktieren Sie den Administrator.',
            variant: 'destructive',
            dedupeKey: 'login-inactive-error',
            dedupeStrategy: 'replace'
          });
        } else {
          // Set regular error message display in the form
          setErrorMessage(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
          
          // Show toast for unexpected errors only
          toast({
            title: 'Login fehlgeschlagen',
            description: error.message || 'Ein unerwarteter Fehler ist aufgetreten',
            variant: 'destructive',
            dedupeKey: 'login-error',
            dedupeStrategy: 'replace'
          });
        }
      } else {
        // Set a specific German error message instead of the generic English one
        setErrorMessage('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        
        // Show toast for unexpected errors
        toast({
          title: 'Login fehlgeschlagen',
          description: 'Ein unerwarteter Fehler ist aufgetreten',
          variant: 'destructive',
          dedupeKey: 'login-error',
          dedupeStrategy: 'replace'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required 
          placeholder="Enter your email"
          className={errorMessage ? 'border-destructive' : ''}
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password"
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          required 
          placeholder="Enter your password"
          className={errorMessage ? 'border-destructive' : ''}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};

export default LoginForm;
