'use client';

import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  className?: string;
  showInfo?: boolean;
  totalItems?: number;
  pageSize?: number;
}

/**
 * Simple pagination component with Previous - 1 - 2 - 3 - Next layout
 */
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className,
  showInfo = true,
  totalItems,
  pageSize
}: SimplePaginationProps) {
  
  // Don't render if there are no pages
  if (totalPages <= 0) return null;
  
  // Calculate visible page range
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  
  const visiblePages = getVisiblePages();
  
  // Calculate item range for info display
  const itemStart = totalItems ? Math.max(1, (currentPage - 1) * (pageSize || 10) + 1) : 0;
  const itemEnd = totalItems ? Math.min(currentPage * (pageSize || 10), totalItems) : 0;
  
  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      {/* Items info */}
      {showInfo && totalItems !== undefined && (
        <div className="text-sm text-muted-foreground">
          {totalItems === 0 ? (
            "No items"
          ) : (
            <>
              Showing <span className="font-medium">{itemStart}</span> to{' '}
              <span className="font-medium">{itemEnd}</span> of{' '}
              <span className="font-medium">{totalItems}</span> items
            </>
          )}
        </div>
      )}
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          
          {/* First page + ellipsis if needed */}
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant={1 === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(1)}
                className="w-10 h-9"
              >
                1
              </Button>
              {visiblePages[0] > 2 && (
                <div className="px-2 text-muted-foreground">...</div>
              )}
            </>
          )}
          
          {/* Visible page numbers */}
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                "w-10 h-9",
                page === currentPage && "bg-primary text-primary-foreground"
              )}
            >
              {page}
            </Button>
          ))}
          
          {/* Last page + ellipsis if needed */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <div className="px-2 text-muted-foreground">...</div>
              )}
              <Button
                variant={totalPages === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="w-10 h-9"
              >
                {totalPages}
              </Button>
            </>
          )}
          
          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default SimplePagination;
