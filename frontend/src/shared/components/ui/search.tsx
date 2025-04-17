'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search as SearchIcon, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Input } from './input';
import { Button } from './button';

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * The URL query parameter key to store the search term
   * @default "search"
   */
  paramKey?: string;
  
  /**
   * Minimum search term length
   * @default 2
   */
  minLength?: number;
  
  /**
   * Delay (ms) before applying the search query after typing
   * @default 300
   */
  debounceTime?: number;
  
  /**
   * Callback to run when the search term changes
   */
  onSearchChange?: (value: string) => void;
  
  /**
   * Additional class name for the container
   */
  containerClassName?: string;
  
  /**
   * Whether to show a clear button when there's a search term
   * @default true
   */
  showClearButton?: boolean;
  
  /**
   * Whether to preserve other query parameters when searching
   * @default true
   */
  preserveParams?: boolean;
}

/**
 * Search component with debounce and query parameter integration
 * This component handles search operations and synchronizes the search term with the URL
 */
export function Search({
  paramKey = 'search',
  minLength = 2,
  debounceTime = 300,
  onSearchChange,
  containerClassName,
  placeholder = 'Search...',
  className,
  showClearButton = true,
  preserveParams = true,
  ...props
}: SearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get the search term from URL parameters or use empty string
  const searchTerm = searchParams?.get(paramKey) || '';
  
  // Local state for the search input value
  const [searchValue, setSearchValue] = React.useState(searchTerm);
  
  // Create a debounce timeout ref
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);
  
  // Update searchValue when URL parameter changes
  React.useEffect(() => {
    if (searchTerm !== searchValue) {
      setSearchValue(searchTerm);
    }
  }, [searchTerm, searchValue]);
  
  // Handle input change with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Create new timeout for the search
    debounceTimeout.current = setTimeout(() => {
      // Only update search params if the value meets the minimum length or is empty
      if (value.length >= minLength || value === '') {
        updateSearchParams(value);
        
        // Call the onSearchChange callback if provided
        if (onSearchChange) {
          onSearchChange(value);
        }
      }
    }, debounceTime);
  };
  
  // Update search parameters in URL
  const updateSearchParams = (value: string) => {
    // Create a new URLSearchParams object from current query parameters
    const params = new URLSearchParams(preserveParams ? searchParams?.toString() : '');
    
    // Update or remove the search parameter
    if (value) {
      params.set(paramKey, value);
    } else {
      params.delete(paramKey);
    }
    
    // Get clean URL parameters string
    const paramsString = params.toString();
    const queryString = paramsString ? `?${paramsString}` : '';
    
    // Update the URL with the new search parameter
    router.push(`${pathname}${queryString}`);
  };
  
  // Handle clearing the search
  const handleClear = () => {
    setSearchValue('');
    updateSearchParams('');
    
    // Call the onSearchChange callback if provided
    if (onSearchChange) {
      onSearchChange('');
    }
    
    // Focus the input after clearing
    document.getElementById('search-input')?.focus();
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update search params immediately on submit without debounce
    if (searchValue.length >= minLength || searchValue === '') {
      updateSearchParams(searchValue);
      
      // Call the onSearchChange callback if provided
      if (onSearchChange) {
        onSearchChange(searchValue);
      }
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "relative flex w-full items-center",
        containerClassName
      )}
    >
      <Input
        id="search-input"
        type="search"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "pr-8 focus-visible:ring-offset-0",
          className
        )}
        {...props}
      />
      <div className="absolute right-0 flex items-center pr-2">
        {showClearButton && searchValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {!searchValue && (
          <SearchIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
    </form>
  );
}