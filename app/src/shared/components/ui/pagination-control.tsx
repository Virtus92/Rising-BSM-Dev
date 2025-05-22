'use client';

import React, { useMemo } from 'react';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis
} from './pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '@/shared/utils/cn';

export interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showItemsInfo?: boolean;
  showFirstLast?: boolean;
  maxPageButtons?: number;
  className?: string;
  compact?: boolean;
}

/**
 * Enhanced pagination control component with improved UX
 * Provides comprehensive pagination with page size selection and info display
 */
export function PaginationControl({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showItemsInfo = true,
  showFirstLast = true,
  maxPageButtons = 7,
  className,
  compact = false
}: PaginationControlProps) {
  
  // Calculate visible page range
  const pageRange = useMemo(() => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const halfButtons = Math.floor(maxPageButtons / 2);
    let start = Math.max(1, currentPage - halfButtons);
    let end = Math.min(totalPages, start + maxPageButtons - 1);
    
    // Adjust start if we're near the end
    if (end - start < maxPageButtons - 1) {
      start = Math.max(1, end - maxPageButtons + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxPageButtons]);
  
  // Calculate item range
  const itemStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const itemEnd = Math.min(currentPage * pageSize, totalItems);
  
  // Early return for no data
  if (totalPages === 0 || totalItems === 0) {
    return (
      <div className={cn("flex items-center justify-between gap-4 py-4", className)}>
        {showItemsInfo && (
          <div className="text-sm text-muted-foreground">
            No items to display
          </div>
        )}
      </div>
    );
  }
  
  // Compact mode for mobile
  if (compact) {
    return (
      <div className={cn("flex items-center justify-between gap-2 py-4", className)}>
        {showItemsInfo && (
          <div className="text-xs text-muted-foreground">
            {itemStart}-{itemEnd} of {totalItems}
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <PaginationPrevious 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage === 1}
            className={cn(
              "h-8 px-2 text-xs",
              currentPage === 1 && "pointer-events-none opacity-50"
            )}
          />
          
          <div className="text-xs text-muted-foreground px-2">
            {currentPage} / {totalPages}
          </div>
          
          <PaginationNext 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            aria-disabled={currentPage === totalPages}
            className={cn(
              "h-8 px-2 text-xs",
              currentPage === totalPages && "pointer-events-none opacity-50"
            )}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      {/* Items info and page size selector */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {showItemsInfo && (
          <div className="flex items-center gap-1">
            <span>Showing</span>
            <span className="font-medium text-foreground">{itemStart}</span>
            <span>to</span>
            <span className="font-medium text-foreground">{itemEnd}</span>
            <span>of</span>
            <span className="font-medium text-foreground">{totalItems}</span>
            <span>items</span>
          </div>
        )}
        
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        )}
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {/* First page button */}
            {showFirstLast && currentPage > 2 && (
              <PaginationItem>
                <PaginationFirst
                  onClick={() => onPageChange(1)}
                  className="hover:bg-accent transition-colors"
                />
              </PaginationItem>
            )}
            
            {/* Previous page button */}
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
                className={cn(
                  "hover:bg-accent transition-colors",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            
            {/* Show ellipsis if there are pages before the range */}
            {pageRange[0] > 1 && (
              <>
                {pageRange[0] > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}
            
            {/* Page number buttons */}
            {pageRange.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "hover:bg-accent transition-colors",
                    page === currentPage && "bg-accent font-medium"
                  )}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            {/* Show ellipsis if there are pages after the range */}
            {pageRange[pageRange.length - 1] < totalPages && (
              <>
                {pageRange[pageRange.length - 1] < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}
            
            {/* Next page button */}
            <PaginationItem>
              <PaginationNext 
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage === totalPages}
                className={cn(
                  "hover:bg-accent transition-colors",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            
            {/* Last page button */}
            {showFirstLast && currentPage < totalPages - 1 && (
              <PaginationItem>
                <PaginationLast
                  onClick={() => onPageChange(totalPages)}
                  className="hover:bg-accent transition-colors"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
