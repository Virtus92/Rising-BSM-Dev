'use client';

import { ReactNode } from 'react';
import { Button } from '@/shared/components/ui/button';
import { X, Filter } from 'lucide-react';

/**
 * Base filter panel props
 */
export interface BaseFilterPanelProps {
  /**
   * Filter panel title
   */
  title?: string;
  
  /**
   * Icon to display in the title
   */
  icon?: ReactNode;
  
  /**
   * Child filter components
   */
  children: ReactNode;
  
  /**
   * Handler for applying filters
   */
  onApply: () => void;
  
  /**
   * Handler for resetting filters
   */
  onReset: () => void;
  
  /**
   * Whether to show the apply button
   */
  showApplyButton?: boolean;
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * Theme color for the panel
   */
  themeColor?: string;
}

/**
 * Base filter panel component with consistent styling
 */
export function BaseFilterPanel({
  title = 'Filters',
  icon,
  children,
  onApply,
  onReset,
  showApplyButton = true,
  className = '',
  themeColor = 'gray'
}: BaseFilterPanelProps) {
  return (
    <div className={`p-6 border rounded-lg mb-6 space-y-6 bg-white dark:bg-gray-800 shadow-sm border-${themeColor}-200 dark:border-${themeColor}-800 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon || <Filter className={`h-5 w-5 text-${themeColor}-600`} />}
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      
      {children}
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="outline" 
          className={`text-${themeColor}-600 border-${themeColor}-200 hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-950/10`}
          onClick={onReset}
        >
          Reset Filters
        </Button>
        
        {showApplyButton && (
          <Button 
            className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white shadow-sm`}
            onClick={onApply}
          >
            Apply Filters
          </Button>
        )}
      </div>
    </div>
  );
}
