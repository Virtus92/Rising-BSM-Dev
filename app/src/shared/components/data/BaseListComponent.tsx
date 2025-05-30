'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/components/ui/table';
import { SimplePagination } from '@/shared/components/ui/simple-pagination';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { 
  Loader2, 
  RefreshCw, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  XCircle, 
  Filter, 
  Plus, 
  FileText, 
  LayoutList 
} from 'lucide-react';
import { ActiveFilterInfo } from '@/shared/utils/list/baseListUtils';

// ----- TYPE DEFINITIONS -----

/**
 * Column definition for table views
 */
export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  sortable?: boolean;
}

/**
 * Card props for card view
 * Note: only includes properties needed from BaseCardProps to avoid tight coupling
 */
export interface CardProps<T> {
  item: T;
  onActionClick?: (action: string, item: T) => void;
  title?: string | ((item: T) => string); // Added to fix compatibility with BaseCardProps
}

/**
 * Props for BaseListComponent
 */
export interface BaseListComponentProps<T> {
  // ----- Data Props -----
  items: T[];
  isLoading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  
  // ----- Configuration -----
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string | number;
  cardComponent?: React.FC<CardProps<T>>;
  
  // ----- UI Text -----
  title?: string;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  errorStateMessage?: string;
  createButtonLabel?: string;
  
  // ----- Display Options -----
  showHeader?: boolean;
  showSearch?: boolean;
  showToolbar?: boolean;
  forceCardView?: boolean;
  showCreateButton?: boolean;
  
  // ----- Active Filters -----
  activeFilters?: ActiveFilterInfo[];
  
  // ----- Actions -----
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  onCreateClick?: () => void;
  onRefresh?: () => void;
  onFilterToggle?: () => void;
  onClearAllFilters?: () => void;
  onActionClick?: (action: string, item: T) => void;
  
  // ----- Filter Panel -----
  filterPanel?: ReactNode;
  showFilters?: boolean;
  
  // ----- Sort State -----
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  
  // ----- Custom UI Elements -----
  headerActions?: ReactNode;
  rowActions?: (item: T) => ReactNode;
  toolbarActions?: ReactNode; // Added to support toolbar actions in NotificationList
  
  // ----- Styling -----
  className?: string; // Added to support custom styling
}

/**
 * BaseListComponent handles the presentation of list data
 * with support for both table and card views, filtering, sorting, and pagination
 */
export function BaseListComponent<T extends {}>({
  // Data props
  items,
  isLoading,
  error,
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  
  // Configuration
  columns,
  keyExtractor,
  cardComponent: CardComponent,
  
  // UI text
  title,
  searchPlaceholder = 'Search...',
  emptyStateMessage = 'No items found',
  errorStateMessage = 'An error occurred while loading data',
  createButtonLabel = 'Create',
  
  // Display options
  showHeader = true,
  showSearch = true,
  showToolbar = true,
  forceCardView = false,
  showCreateButton = true,
  
  // Active filters
  activeFilters,
  
  // Actions
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortChange,
  onCreateClick,
  onRefresh,
  onFilterToggle,
  onClearAllFilters,
  onActionClick,
  
  // Filter panel
  filterPanel,
  showFilters,
  
  // Sort state
  sortColumn,
  sortDirection,
  
  // Custom UI elements
  headerActions,
  rowActions,
  toolbarActions,
  
  // Styling
  className = ''
}: BaseListComponentProps<T>) {
  // ----- HOOKS -----
  
  // Detect mobile view for responsive design
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Local state for view mode and search
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(
    forceCardView || isMobile ? 'cards' : 'table'
  );
  const [searchTerm, setSearchTerm] = useState('');
  
  // ----- EFFECTS -----
  
  // Update view mode based on screen size or forced mode
  useEffect(() => {
    if (forceCardView) {
      setViewMode('cards');
    } else if (isMobile) {
      setViewMode('cards');
    } else {
      setViewMode('table');
    }
  }, [isMobile, forceCardView]);
  
  // ----- EVENT HANDLERS -----
  
  // Handle search input change
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  }, []);
  
  // Debounced search with proper cleanup
  useEffect(() => {
    if (!onSearchChange) return;
    
    const timer = setTimeout(() => {
      // Always call onSearchChange, even with empty string
      onSearchChange(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);
  
  // Handle search on Enter key
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchChange) {
      onSearchChange(searchTerm);
    }
  }, [onSearchChange, searchTerm]);
  
  // Handle card action clicks
  const handleCardAction = useCallback((action: string, item: T) => {
    if (onActionClick) {
      onActionClick(action, item);
    }
  }, [onActionClick]);
  
  // Handle sort column click
  const handleSortClick = useCallback((column: string) => {
    if (!onSortChange) return;
    
    if (sortColumn === column) {
      // Toggle direction if already sorting by this column
      onSortChange(column, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new sort column
      onSortChange(column, 'asc');
    }
  }, [onSortChange, sortColumn, sortDirection]);
  
  // ----- RENDER HELPERS -----
  
  // Get sort icon for table headers
  const getSortIcon = useCallback((column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="ml-1 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-1 h-4 w-4" />
      );
    }
    return null;
  }, [sortColumn, sortDirection]);
  
  // Render header section
  const renderHeader = useCallback(() => {
    if (!showHeader && !title && !onCreateClick && !headerActions) {
      return null;
    }
    
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {title && (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
              <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onCreateClick && showCreateButton && (
            <Button 
              onClick={onCreateClick} 
              size="sm"
              className="shadow-sm hover:shadow-md transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              {createButtonLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }, [createButtonLabel, headerActions, onCreateClick, showCreateButton, showHeader, title]);
  
  // Render toolbar section
  const renderToolbar = useCallback(() => {
    if (!showToolbar && !onSearchChange && !onFilterToggle && !onRefresh) {
      return null;
    }
    
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        {showSearch && onSearchChange && (
          <div className="relative flex-1">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchKeyDown}
              className="pr-10 focus-visible:ring-2 focus-visible:ring-offset-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            />
            <div className="absolute right-2.5 top-2.5 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
          </div>
        )}
        
        <div className="flex gap-2 flex-wrap">
          {toolbarActions && (
            <div className="flex gap-2">{toolbarActions}</div>
          )}

          {onFilterToggle && (
            <Button 
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={onFilterToggle}
              className="whitespace-nowrap hover:shadow-sm transition-all duration-200"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              Filters {showFilters && <span className="ml-1 text-xs">(Active)</span>}
            </Button>
          )}
          
          {!forceCardView && CardComponent && (
            <div className="hidden sm:flex h-9 border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-r-none border-0 px-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Table View"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-l-none border-0 px-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Card View"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRefresh}
              title="Refresh"
              className="hover:shadow-sm transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }, [
    CardComponent, 
    forceCardView, 
    handleSearchInputChange, 
    handleSearchKeyDown, 
    onFilterToggle, 
    onRefresh, 
    onSearchChange, 
    searchPlaceholder, 
    searchTerm, 
    showFilters, 
    showSearch, 
    showToolbar, 
    toolbarActions,
    viewMode
  ]);
  
  // Render active filters
  const renderActiveFilters = useCallback(() => {
    if (!activeFilters || activeFilters.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2 items-center py-2 px-3 mb-4 bg-muted/40 rounded-md border border-border/60">
        <span className="text-sm font-medium mr-1">Active Filters:</span>
        
        {activeFilters.map((filter, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="flex items-center gap-1 bg-background shadow-sm py-1.5"
          >
            <span className="font-medium">{filter.label}:</span> {filter.value}
            <button 
              className="ml-1 hover:bg-muted rounded-full p-0.5"
              onClick={filter.onRemove}
              aria-label={`Remove ${filter.label} filter`}
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ))}
        
        {onClearAllFilters && activeFilters.length > 1 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearAllFilters}
            className="h-7 px-3 text-xs ml-auto shadow-sm"
          >
            Clear all filters
          </Button>
        )}
      </div>
    );
  }, [activeFilters, onClearAllFilters]);
  
  // Render table view
  const renderTable = useCallback(() => (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={`font-semibold text-gray-900 dark:text-gray-100 ${
                  column.sortable && onSortChange && column.accessorKey 
                    ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150" 
                    : ""
                }`}
                onClick={() => {
                  if (column.sortable && onSortChange && column.accessorKey) {
                    handleSortClick(column.accessorKey as string);
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && onSortChange && column.accessorKey && 
                    getSortIcon(column.accessorKey as string)}
                </div>
              </TableHead>
            ))}
            {rowActions && <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length + (rowActions ? 1 : 0)}
                className="h-32 text-center text-gray-500 dark:text-gray-400"
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  <span>No results found</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, itemIndex) => (
              <TableRow 
                key={keyExtractor(item)}
                className={`border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150 ${
                  itemIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-800/10'
                }`}
              >
                {columns.map((column, index) => (
                  <TableCell key={index} className="text-gray-900 dark:text-gray-100">
                    {column.cell 
                      ? column.cell(item) 
                      : column.accessorKey 
                        ? String(item[column.accessorKey] || '')
                        : null}
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell className="text-right">
                    {rowActions(item)}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  ), [columns, getSortIcon, handleSortClick, items, keyExtractor, onSortChange, rowActions]);
  
  // Render cards view
  const renderCards = useCallback(() => {
    if (!CardComponent) {
      return (
        <div className="bg-muted rounded-md p-4 text-center">
          <p className="text-muted-foreground">
            Card view is not available for this content.
          </p>
        </div>
      );
    }
    
    if (items.length === 0) {
      return (
        <div className="bg-muted/50 rounded-md p-8 text-center border border-border/50">
          <p className="text-muted-foreground">
            No results found
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <CardComponent 
            key={keyExtractor(item)}
            item={item}
            onActionClick={handleCardAction}
          />
        ))}
      </div>
    );
  }, [CardComponent, handleCardAction, items, keyExtractor]);
  
  // Render pagination
  const renderPagination = useCallback(() => {
    // Always render pagination if we have items, even with only one page
    if (!totalPages) return null;
    
    return (
      <div className="mt-6 border-t pt-4">
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          maxVisiblePages={5}
          showInfo={true}
        />
      </div>
    );
  }, [currentPage, totalPages, totalItems, pageSize, onPageChange]);
  
  // ----- COMPONENT STATE RENDERING -----
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 p-4 rounded-md ${className}`}>
        {title && (
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        )}
        
        <Skeleton className="h-10 w-full mb-4" />
        
        {viewMode === 'table' ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        )}
        
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`space-y-4 p-4 rounded-md ${className}`}>
        {showHeader && renderHeader()}
        
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start">
          <XCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-destructive mb-1">Error</h3>
            <p className="text-destructive/80">{error || errorStateMessage}</p>
            {error?.toLowerCase().includes('token') && (
              <p className="mt-2 text-sm">It appears your session has expired. Please try <a href="/auth/login" className="text-primary underline">logging in</a> again.</p>
            )}
          </div>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="ml-4 flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Empty state
  if (items.length === 0) {
    return (
      <div className={`space-y-4 p-4 rounded-md ${className}`}>
        {showHeader && renderHeader()}
        {showToolbar && renderToolbar()}
        {renderActiveFilters()}
        {showFilters && filterPanel}
        
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-lg bg-background/50 shadow-inner">
          <div className="bg-muted rounded-full p-4 mb-5 shadow-sm">
            <Plus className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-3">{emptyStateMessage}</h3>
          <p className="text-muted-foreground text-center mb-7 max-w-md">
            {activeFilters && activeFilters.length > 0 
              ? "No items match your current filters. Try adjusting or clearing your filters." 
              : "There are no items in this list yet."}
          </p>
          
          <div className="flex gap-3">
            {activeFilters && activeFilters.length > 0 && onClearAllFilters ? (
              <Button 
                variant="outline" 
                onClick={onClearAllFilters}
                className="shadow-sm"
              >
                Clear All Filters
              </Button>
            ) : null}
            
            {onCreateClick && showCreateButton && (
              <Button 
                onClick={onCreateClick}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="mr-2 h-4 w-4" />
                {createButtonLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Normal content state
  return (
    <div className={`space-y-4 p-4 rounded-md ${className}`}>
      {showHeader && renderHeader()}
      {showToolbar && renderToolbar()}
      {renderActiveFilters()}
      {showFilters && filterPanel}
      {viewMode === 'table' ? renderTable() : renderCards()}
      {renderPagination()}
    </div>
  );
}
