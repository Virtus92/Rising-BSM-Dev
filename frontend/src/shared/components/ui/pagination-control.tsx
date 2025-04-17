'use client';

import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast
} from '@/shared/components/ui/pagination';

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5,
}) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Determine which pages to show based on current page and total pages
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    
    // Always include first and last page
    const alwaysVisible = [1, totalPages];
    
    // Determine the range around current page to show
    let rangeStart = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
    let rangeEnd = Math.min(totalPages - 1, rangeStart + maxVisiblePages - 3);
    
    // Adjust range if we're at the beginning or end
    if (rangeEnd - rangeStart < maxVisiblePages - 3) {
      rangeStart = Math.max(2, rangeEnd - (maxVisiblePages - 3));
    }
    
    // Add page 1
    pages.push(1);
    
    // Add ellipsis if needed between page 1 and range start
    if (rangeStart > 2) {
      pages.push('ellipsis');
    }
    
    // Add pages in the middle
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed between range end and last page
    if (rangeEnd < totalPages - 1) {
      pages.push('ellipsis');
    }
    
    // Add last page if it's not page 1
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  
  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <Pagination>
      <PaginationContent>
        {/* First page button */}
        {showFirstLast && currentPage > 1 && (
          <PaginationItem>
            <PaginationFirst onClick={() => handlePageClick(1)} />
          </PaginationItem>
        )}
        
        {/* Previous page button */}
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious onClick={() => handlePageClick(currentPage - 1)} />
          </PaginationItem>
        )}
        
        {/* Page numbers */}
        {visiblePages.map((page, index) => 
          page === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink 
                isActive={page === currentPage}
                onClick={() => handlePageClick(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        
        {/* Next page button */}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext onClick={() => handlePageClick(currentPage + 1)} />
          </PaginationItem>
        )}
        
        {/* Last page button */}
        {showFirstLast && currentPage < totalPages && (
          <PaginationItem>
            <PaginationLast onClick={() => handlePageClick(totalPages)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
};