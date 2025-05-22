'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/shared/components/ui/dropdown-menu';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { ArrowLeft, Edit, Trash2, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';

// Types
interface StatusOption {
  value: string;
  label: string;
  color?: string;
}

interface ActionButton {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
}

interface InfoItem {
  label: string;
  value: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  emptyText?: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  content: ReactNode;
}

interface DetailPageLayoutProps {
  // Header configuration
  title: string;
  subtitle?: string;
  statusBadge: ReactNode;
  onBack: () => void;
  
  // Action buttons
  editLink?: string;
  onEdit?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
  customActions?: ActionButton[];
  
  // Status management
  currentStatus?: string;
  statusOptions?: StatusOption[];
  onStatusChange?: (status: string) => void;
  changingStatus?: boolean;
  
  // Profile summary
  avatar: {
    initials: string;
    bgColor?: string;
    textColor?: string;
  };
  profileInfo: InfoItem[];
  
  // Tabs configuration
  tabs: TabConfig[];
  defaultTab?: string;
  
  // Delete confirmation
  deleteTitle?: string;
  deleteDescription?: string;
  showDeleteDialog?: boolean;
  setShowDeleteDialog?: (show: boolean) => void;
  
  // Loading states
  isLoading?: boolean;
  error?: Error | string | null;
  
  // Additional props
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
}

export const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
  title,
  subtitle,
  statusBadge,
  onBack,
  editLink,
  onEdit,
  canEdit = false,
  canDelete = false,
  onDelete,
  customActions = [],
  currentStatus,
  statusOptions = [],
  onStatusChange,
  changingStatus = false,
  avatar,
  profileInfo,
  tabs,
  defaultTab,
  deleteTitle = 'Delete Item',
  deleteDescription = 'Are you sure you want to delete this item? This action cannot be undone.',
  showDeleteDialog = false,
  setShowDeleteDialog,
  isLoading = false,
  error,
  maxWidth = '7xl',
  className = ''
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id || '');

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage = typeof error === 'string' ? error : error instanceof Error ? error.message : 'An error occurred';
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-red-500 text-center mb-4">{errorMessage}</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  const maxWidthClass = `max-w-${maxWidth}`;

  return (
    <div className={`container mx-auto space-y-6 py-4 ${maxWidthClass} ${className}`}>
      {/* Header Section */}
      <div className="space-y-4 pb-6">
        {/* Back button */}
        <div className="flex">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        {/* Title and status badge */}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold mr-2">{title}</h1>
          <div className="mt-0.5">{statusBadge}</div>
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        )}
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
          {/* Edit button */}
          {canEdit && (editLink || onEdit) && (
            editLink ? (
              <Link href={editLink} className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto h-9">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto h-9"
                onClick={onEdit}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )
          )}
          
          {/* Status change dropdown */}
          {statusOptions.length > 0 && onStatusChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto h-9"
                  disabled={changingStatus}
                >
                  {changingStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="mr-2 h-4 w-4" />
                  )}
                  Change Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {statusOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    disabled={currentStatus === option.value}
                    className={currentStatus === option.value ? 'bg-muted cursor-default' : ''}
                    onClick={() => currentStatus !== option.value && onStatusChange(option.value)}
                  >
                    {currentStatus === option.value && (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                    )}
                    <span className={currentStatus === option.value ? 'font-medium ml-6' : ''}>
                      {option.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Custom action buttons */}
          {customActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              className="w-full sm:w-auto h-9"
            >
              {action.loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <action.icon className="mr-2 h-4 w-4" />
              )}
              {action.label}
            </Button>
          ))}
          
          {/* Delete button */}
          {canDelete && onDelete && setShowDeleteDialog && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowDeleteDialog(true)}
              className="w-full sm:w-auto h-9"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>
      
      {/* Profile Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 flex flex-col md:flex-row gap-6">
          {/* Avatar and basic info */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-4 md:w-48">
            <Avatar className="h-24 w-24 text-lg">
              <AvatarFallback 
                className={`${avatar.bgColor || 'bg-blue-100'} ${avatar.textColor || 'text-blue-700'} ${avatar.bgColor?.includes('dark:') ? '' : 'dark:bg-blue-900 dark:text-blue-200'}`}
              >
                {avatar.initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left md:text-center space-y-1">
              <h2 className="text-xl font-semibold">{title}</h2>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
              <div className="my-2">
                {statusBadge}
              </div>
            </div>
          </div>
          
          {/* Information grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {profileInfo.map((item, index) => (
              <div key={index} className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <div className="flex items-center">
                  <item.icon className={`h-4 w-4 mr-2 ${item.iconColor}`} />
                  {item.value || (
                    <p className="text-gray-400 dark:text-gray-500 italic text-sm">
                      {item.emptyText || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col space-y-2">
          <div className="overflow-x-auto pb-1">
            <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex w-full justify-center flex-nowrap">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="rounded-md min-w-max">
                  <tab.icon className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>
        
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6 px-2 sm:px-0">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Delete confirmation dialog */}
      {showDeleteDialog && setShowDeleteDialog && onDelete && (
        <DeleteConfirmationDialog
          title={deleteTitle}
          description={deleteDescription}
          onConfirm={onDelete}
          onClose={() => setShowDeleteDialog(false)}
          open={showDeleteDialog}
        />
      )}
    </div>
  );
};

// Utility function to create status badges with consistent styling
export const createStatusBadge = (status: string, statusConfig: Record<string, { color: string; label: string }>) => {
  const config = statusConfig[status];
  if (!config) {
    return <Badge>{status}</Badge>;
  }
  
  return (
    <Badge className={`${config.color} text-white hover:${config.color}/80`}>
      {config.label}
    </Badge>
  );
};

// Utility function to get initials from name
export const getInitials = (name: string | undefined, fallback = 'UN'): string => {
  if (!name) return fallback;
  
  return name
    .split(' ')
    .map(part => part?.[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export default DetailPageLayout;