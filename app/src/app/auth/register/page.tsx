'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { useAuth, RegisterData } from '@/features/auth/providers/AuthProvider';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Type definitions for form fields and errors
 */
type FormData = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  acceptTerms: boolean;
};

type FormErrors = {
  [K in keyof FormData]?: string;
};

export default function RegisterPage() {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    acceptTerms: false,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hooks
  const { register } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name as keyof FormData]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: checked
    }));
    
    // Clear error when field is updated
    if (errors[name as keyof FormData]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    // Password confirmation validation
    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }
    
    // Terms validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skip if already submitting
    if (isSubmitting) return;
    
    // Validate
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Create registration data
      const registerData: RegisterData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        terms: formData.acceptTerms
      };
      
      const result = await register(registerData);
      
      if (result.success) {
        toast({
          title: 'Registration successful',
          description: 'Please sign in with your new credentials.',
          variant: 'success',
        });
        
        // Redirect to login screen
        router.push('/auth/login');
      } else {
        toast({
          title: 'Registration failed',
          description: result.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Registration failed:', error as Error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Create your account</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Join Rising BSM to streamline your business operations
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="John Doe"
            className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              errors.name ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>
        
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="john@example.com"
            className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              errors.email ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
        </div>
        
        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="At least 8 characters"
              className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                errors.password ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
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
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
          )}
        </div>
        
        {/* Confirm Password Field */}
        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type={showPasswordConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={formData.passwordConfirm}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Confirm your password"
              className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                errors.passwordConfirm ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
            >
              {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.passwordConfirm && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.passwordConfirm}</p>
          )}
        </div>
        
        {/* Terms and Conditions */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={handleCheckboxChange}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="acceptTerms" className="text-slate-700 dark:text-slate-300">
              I agree to the <Link href="/terms" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Terms of Service</Link> and <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Privacy Policy</Link>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.acceptTerms}</p>
            )}
          </div>
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
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-5 w-5" />
              Create account
            </>
          )}
        </button>
        
        {/* Sign in link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
