import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from './button';

/**
 * Pagination-Komponente für Seitennavigation
 */
interface PaginationProps {
  /**
   * Aktuelle Seite
   */
  currentPage: number;
  
  /**
   * Gesamtanzahl der Seiten
   */
  totalPages: number;
  
  /**
   * Callback für Seitenwechsel
   */
  onPageChange: (page: number) => void;
  
  /**
   * Maximale Anzahl an Seitenzahlen, die angezeigt werden
   * @default 5
   */
  maxVisiblePages?: number;
  
  /**
   * Zusätzliche CSS-Klassen
   */
  className?: string;
}

/**
 * Pagination-Komponente für die Seitennavigation in Listen
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className,
}) => {
  // Sicherstellen, dass die Seitenwerte gültig sind
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const validTotalPages = Math.max(1, totalPages);
  
  // Keine Pagination anzeigen, wenn nur eine Seite vorhanden ist
  if (validTotalPages <= 1) {
    return null;
  }

  // Sichtbare Seitenzahlen berechnen
  const getVisiblePageNumbers = () => {
    const pages = [];
    
    // Bei wenigen Seiten alle anzeigen
    if (validTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= validTotalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Ansonsten erste, letzte und einige Seiten um die aktuelle herum anzeigen
    const sidePages = Math.floor((maxVisiblePages - 2) / 2);
    const leftSide = Math.max(1, validCurrentPage - sidePages);
    const rightSide = Math.min(validTotalPages, validCurrentPage + sidePages);
    
    // Immer die erste Seite einschließen
    if (leftSide > 1) {
      pages.push(1);
      if (leftSide > 2) {
        pages.push(-1); // Platzhalter für Ellipsis
      }
    }
    
    // Seiten um die aktuelle herum
    for (let i = leftSide; i <= rightSide; i++) {
      pages.push(i);
    }
    
    // Immer die letzte Seite einschließen
    if (rightSide < validTotalPages) {
      if (rightSide < validTotalPages - 1) {
        pages.push(-2); // Platzhalter für Ellipsis (anderer Wert für den Key)
      }
      pages.push(validTotalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePageNumbers();

  return (
    <nav
      className={cn("flex items-center justify-center space-x-1", className)}
      aria-label="Pagination"
    >
      {/* Zurück-Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={validCurrentPage === 1}
        onClick={() => onPageChange(validCurrentPage - 1)}
        aria-label="Vorherige Seite"
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Seitenzahlen */}
      {visiblePages.map((page, index) => {
        // Ellipsis für ausgelassene Seiten
        if (page < 0) {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }
        
        // Normale Seitenzahl
        return (
          <Button
            key={page}
            variant={page === validCurrentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            aria-label={`Gehe zu Seite ${page}`}
            aria-current={page === validCurrentPage ? "page" : undefined}
            className="h-8 w-8 p-0"
          >
            {page}
          </Button>
        );
      })}
      
      {/* Vorwärts-Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={validCurrentPage === validTotalPages}
        onClick={() => onPageChange(validCurrentPage + 1)}
        aria-label="Nächste Seite"
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};
