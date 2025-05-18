'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useToast } from '@/shared/hooks/useToast';
import { getLogger } from '@/core/logging';

// This component will use the search params
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { signIn } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  
  // Reset error message when inputs change
  useEffect(() => {
    if (errorMessage) setErrorMessage(null);
  }, [email, password, errorMessage]);

  
  // Use logger for consistent logging
  const logger = getLogger();
  
  // Streamlined authentication verification and redirect flow
  const verifyAuthAndRedirect = async () => {
    // Generate unique ID for tracking this authentication flow in logs
    const verifyId = crypto.randomUUID().substring(0, 8);
    
    try {
      logger.info('Starting authentication verification', { verifyId });
      
      // Import necessary services
      const { default: AuthService } = await import('@/features/auth/core/AuthService');
      
      // Initialize with force to ensure fresh state
      await AuthService.initialize({ force: true });
      
      // Add a short delay to allow full initialization
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if authentication was successful after initialization
      const isAuthenticated = await AuthService.isAuthenticated();
      const authState = AuthService.getAuthState();
      
      if (!isAuthenticated || !authState.user) {
        logger.error('Authentication failed - not authenticated after initialization', {
          verifyId,
          authState: JSON.stringify(authState),
          isAuthenticated
        });
        throw new Error('Authentication verification failed');
      }
      
      // Import TokenManager for token state management
      const { TokenManager } = await import('@/core/initialization');
      const token = await TokenManager.getToken();
      
      // Validate token is actually present
      if (!token || token.trim() === '') {
        logger.error('No valid token found after sign in', { verifyId });
        throw new Error('No valid authentication token');
      }
      
      // Log successful verification
      logger.info('Authentication verified successfully', { 
        verifyId,
        userId: authState.user?.id, 
        tokenLength: token.length
      });
      
      // All verification passed, redirect to intended destination
      router.push(returnUrl);
    } catch (error) {
      logger.error('Auth verification failed', {
        verifyId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error; // Rethrow to handle in the calling function
    }
  };

  // Simplified login submission flow without multiple retries
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      setErrorMessage('Email and password are required');
      return;
    }
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      logger.info('Login attempt started', { email });
      
      // Process the login
      const result = await signIn(email, password);
      
      if (!result.success) {
        throw new Error(result.message || 'Authentication failed');
      }
      
      // Check if token is in cookies - important validation
      const hasCookies = document.cookie.includes('js_token=') || 
                        document.cookie.includes('auth_token=') || 
                        document.cookie.includes('access_token=');
      
      if (!hasCookies) {
        logger.error('Authentication cookies not set after login', {
          cookieString: document.cookie.substring(0, 100) // Log partial cookie string for debugging
        });
        throw new Error('Authentication failed - no cookies set');
      }
      
      // Add explicit log for debugging
      logger.debug('Cookie check after login passed', {
        cookieNames: document.cookie.split(';').map(c => c.trim().split('=')[0]),
        hasJsToken: document.cookie.includes('js_token='),
        hasAuthToken: document.cookie.includes('auth_token='),
        hasAccessToken: document.cookie.includes('access_token=')
      });
      
      // Show success toast
      toast({
        title: 'Login successful',
        description: 'Redirecting to dashboard...',
        variant: 'success',
      });
      
      // Short delay to ensure cookies are properly set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify authentication and redirect
      await verifyAuthAndRedirect();
    } catch (error) {
      logger.error('Login error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error) {
        // Set error message based on error
        if (error.message.includes('401') || 
            error.message.toLowerCase().includes('invalid')) {
          setErrorMessage('Invalid email or password');
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          setErrorMessage('Network error. Please check your internet connection.');
        } else if (error.message.includes('token') || error.message.includes('Token')) {
          setErrorMessage(`Authentication token error: ${error.message}`);
        } else {
          setErrorMessage(error.message || 'An unexpected error occurred');
        }
      } else {
        setErrorMessage('An unexpected error occurred');
      }
      
      toast({
        title: 'Login failed',
        description: errorMessage || 'Please check your credentials and try again',
        variant: 'destructive',
      });
      
      // Ensure we reset isSubmitting in case of error
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Sign in to your account</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Welcome back! Enter your credentials below
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
            placeholder="your@email.com"
            className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              errorMessage ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
        </div>
        
        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link 
              href="/auth/forgot-password" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
              placeholder="Enter your password"
              className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                errorMessage ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Error Message */}
        {errorMessage && (
          <div className="text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}
        
        {/* Remember Me */}
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
            Remember me for 30 days
          </label>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-5 w-5" />
              Sign in
            </>
          )}
        </button>
        
        {/* Sign up link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link 
              href="/auth/register" 
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

// Loading fallback for when the Suspense boundary is active
function LoginFormSkeleton() {
  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-2 animate-pulse"></div>
        <div className="h-5 w-72 bg-slate-100 dark:bg-slate-800 rounded-lg mx-auto animate-pulse"></div>
      </div>
      <div className="space-y-6">
        <div>
          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 animate-pulse"></div>
          <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-5 w-full flex items-center">
          <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded-lg ml-2 animate-pulse"></div>
        </div>
        <div className="h-12 w-full bg-indigo-400 dark:bg-indigo-700 rounded-lg animate-pulse"></div>
        <div className="h-5 w-64 mx-auto bg-slate-100 dark:bg-slate-800 rounded-lg mt-6 animate-pulse"></div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
