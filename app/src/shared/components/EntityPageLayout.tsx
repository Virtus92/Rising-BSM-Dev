'use client';

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface EntityPageLayoutProps {
  /** Whether the user can view this entity */
  canView: boolean;
  /** Whether permission check is still loading */
  isPermissionLoading: boolean;
  /** Component to show when user has no permission */
  noPermissionView: React.ReactNode;
  /** The main content to display when user has permission */
  children: React.ReactNode;
  /** Optional wrapper className */
  className?: string;
}

/**
 * Wrapper component for entity pages that handles permission checks
 * and loading states consistently across all entity list pages
 */
export function EntityPageLayout({
  canView,
  isPermissionLoading,
  noPermissionView,
  children,
  className = ''
}: EntityPageLayoutProps) {
  // Show loading spinner while checking permissions
  if (isPermissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show no permission view if user doesn't have access
  if (!canView) {
    return <div className={className}>{noPermissionView}</div>;
  }

  // Show main content if user has permission
  return (
    <div className={`space-y-6 p-4 sm:p-6 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default EntityPageLayout;
