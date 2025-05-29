'use client';

import React, { ReactNode } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

export interface BaseCardProps<T> {
  // The data item to display
  item: T;
  
  // Card header configuration
  title: string | ((item: T) => string);
  description?: string | ((item: T) => string);
  status?: {
    text: string | ((item: T) => string);
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | null;
    className?: string;
  };
  
  // Card content fields
  fields?: {
    label: string;
    value: string | ReactNode | ((item: T) => string | ReactNode);
    icon?: ReactNode;
  }[];
  
  // Card footer actions
  actions?: ReactNode | ((item: T) => ReactNode);
  
  // Extra badges to display
  badges?: {
    text: string | ((item: T) => string);
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | null;
    className?: string;
    icon?: ReactNode;
  }[];
  
  // Additional content
  children?: ReactNode;
  
  // Layout options
  compact?: boolean;
  
  // Card action handler
  onActionClick?: (action: string, item: T) => void;
  
  // Extra class names
  className?: string;
}

/**
 * Base card component used for displaying data in card view
 */
export function BaseCard<T>({
  // Data item
  item,
  
  // Card header
  title,
  description,
  status,
  
  // Card content
  fields,
  
  // Card footer
  actions,
  
  // Extra badges
  badges,
  
  // Additional content
  children,
  
  // Layout options
  compact = false,
  
  // Action handler
  onActionClick,
  
  // Extra classes
  className = ''
}: BaseCardProps<T>) {
  // Resolve title from function or string
  const resolvedTitle = typeof title === 'function' ? title(item) : title;
  
  // Resolve description from function or string
  const resolvedDescription = description 
    ? typeof description === 'function' 
      ? description(item) 
      : description
    : undefined;
  
  // Resolve status
  const resolvedStatus = status 
    ? {
        text: typeof status.text === 'function' ? status.text(item) : status.text,
        variant: status.variant,
        className: status.className
      }
    : undefined;
  
  // Resolve badges
  const resolvedBadges = badges 
    ? badges.map(badge => ({
        text: typeof badge.text === 'function' ? badge.text(item) : badge.text,
        variant: badge.variant,
        className: badge.className,
        icon: badge.icon
      }))
    : undefined;
  
  // Resolve actions
  const resolvedActions = typeof actions === 'function' ? actions(item) : actions;
  
  return (
    <Card className={`overflow-hidden shadow-sm hover:shadow-md transition-all ${compact ? 'p-0' : ''} ${className}`}>
      <CardHeader className={compact ? 'p-3 pb-2' : ''}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={compact ? 'text-base' : ''}>
              {resolvedTitle}
            </CardTitle>
            
            {resolvedDescription && (
              <CardDescription className={compact ? 'text-sm' : ''}>
                {resolvedDescription}
              </CardDescription>
            )}
          </div>
          
          {resolvedStatus && (
            <Badge
              variant={resolvedStatus.variant || 'default'}
              className={resolvedStatus.className}
            >
              {resolvedStatus.text}
            </Badge>
          )}
        </div>
        
        {/* Additional badges */}
        {resolvedBadges && resolvedBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {resolvedBadges.map((badge, index) => (
              <Badge
                key={index}
                variant={badge.variant || 'secondary'}
                className={badge.className}
              >
                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                {badge.text}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className={compact ? 'p-3 pt-0' : ''}>
        {/* Field rows */}
        {fields && fields.length > 0 && (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const fieldValue = typeof field.value === 'function' 
                ? field.value(item) 
                : field.value;
                
              return (
                <div 
                  key={index} 
                  className="flex items-center text-sm"
                >
                  {field.icon && (
                    <span className="mr-2 text-muted-foreground">{field.icon}</span>
                  )}
                  <span className="font-medium min-w-24 text-muted-foreground">
                    {field.label}:
                  </span>
                  <span>{fieldValue}</span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Additional content */}
        {children}
      </CardContent>
      
      {/* Actions */}
      {resolvedActions && (
        <CardFooter className={`border-t mt-2 ${compact ? 'p-3' : ''}`}>
          {resolvedActions}
        </CardFooter>
      )}
    </Card>
  );
}
