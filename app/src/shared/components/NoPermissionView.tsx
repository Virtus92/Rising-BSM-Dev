'use client';

import React from 'react';
import { Shield, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useRouter } from 'next/navigation';

interface NoPermissionViewProps {
  title?: string;
  message?: string;
  permissionNeeded?: string;
  ctaText?: string;
  ctaLink?: string;
  showHomeButton?: boolean;
}

/**
 * NoPermissionView Component
 * 
 * Displays a standardized "no permission" message when a user tries to access content 
 * they don't have permission for
 */
export function NoPermissionView({
  title = 'Access Denied',
  message = 'You don\'t have permission to access this resource.',
  permissionNeeded,
  ctaText,
  ctaLink,
  showHomeButton = true
}: NoPermissionViewProps) {
  const router = useRouter();

  return (
    <div className="w-full py-8 px-4 flex justify-center">
      <Card className="w-full max-w-lg border-red-200 dark:border-red-900">
        <CardHeader className="space-y-1 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center text-center">
          {permissionNeeded && (
            <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 w-full">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p>Required permission:</p>
                <p className="font-mono bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded mt-1 inline-block">
                  {permissionNeeded}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          {showHomeButton && (
            <Button
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          )}
          
          {ctaText && ctaLink && (
            <Button
              onClick={() => router.push(ctaLink)}
              className="w-full sm:w-auto"
            >
              {ctaText}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default NoPermissionView;