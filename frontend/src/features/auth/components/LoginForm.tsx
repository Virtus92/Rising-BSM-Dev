'use client';

import React, { useState, useEffect, useRef } from 'react';
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
      
      // If login succeeds, the auth provider will redirect to dashboard
      toast({
        title: 'Anmeldung erfolgreich',
        description: 'Sie werden zum Dashboard weitergeleitet...',
        variant: 'default'
      });
      
      // Reset form on success
      setEmail('');
      setPassword('');
      formRef.current?.reset();
      
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
        } else if (error.message.includes('profile')) {
          setErrorMessage('Anmeldung erfolgreich, konnte aber Benutzerprofil nicht laden');
        } else if (error.message.includes('not active')) {
          setErrorMessage('Ihr Konto ist nicht aktiv. Bitte kontaktieren Sie den Administrator.');
        } else {
          // Set regular error message display in the form
          setErrorMessage(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      
      // Handle login error with toast notification
      toast({
        title: 'Login fehlgeschlagen',
        description: error instanceof Error 
          ? (error.message.includes('401') 
              ? 'Ungültige E-Mail oder Passwort' 
              : error.message || 'Anmeldefehler')
          : 'Anmeldung konnte nicht durchgeführt werden',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="bg-destructive/15 p-3 rounded-md flex items-start gap-2 text-sm text-destructive mb-4">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      
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
