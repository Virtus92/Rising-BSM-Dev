'use client';

import LoginForm from '@/features/auth/components/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-foreground">Login to Rising BSM</h1>
        <LoginForm />
        <div className="mt-4 text-center">
          <Link 
            href="/auth/register" 
            className="text-sm text-primary hover:underline"
          >
            Don't have an account? Register
          </Link>
        </div>
      </div>
    </div>
  );
}
