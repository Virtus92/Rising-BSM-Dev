'use client';

import { useState, useEffect } from 'react';
import { EntityColors } from '@/shared/utils/entity-colors';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { X, UserPlus, CheckCircle, MapPin, Globe } from 'lucide-react';

interface CustomerFilterPanelProps {
  onFilterChange: (filters: Partial<CustomerFilterParamsDto>) => void;
  initialFilters?: Partial<CustomerFilterParamsDto>;
}

export const CustomerFilterPanel = ({ 
  onFilterChange, 
  initialFilters = {}
}: CustomerFilterPanelProps) => {
  // Initialize filter state using initialFilters prop
  const [filters, setFilters] = useState<Partial<CustomerFilterParamsDto>>({
    type: initialFilters.type,
    status: initialFilters.status,
    city: initialFilters.city || '',
    country: initialFilters.country || '',
  });
  
  // Update local state when initialFilters change
  useEffect(() => {
    setFilters({
      type: initialFilters.type,
      status: initialFilters.status,
      city: initialFilters.city || '',
      country: initialFilters.country || '',
    });
  }, [initialFilters]);
  
  // Handle filter change
  const handleFilterChange = (key: keyof CustomerFilterParamsDto, value: string | undefined) => {
    // Special handling for select values with placeholders
    let newValue: string | undefined = value;
    
    // Parse special filter values
    if (value === 'all-types' || value === 'all-statuses') {
      newValue = undefined;
    }
    // Handle empty strings
    else if (value === '') {
      newValue = undefined;
    }
    
    // Convert string values to enums where needed
    if (key === 'type' && value && value !== 'all-types') {
      newValue = value as CustomerType;
    } else if (key === 'status' && value && value !== 'all-statuses') {
      newValue = value as CommonStatus;
    }
    
    const newFilters = { ...filters, [key]: newValue };
    setFilters(newFilters);
  };
  
  // Apply filters
  const applyFilters = () => {
    // Clean up empty values
    const cleanedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined) {
        // Explicitly type the accumulator object and apply type-safe assignment
        (acc as Record<string, string | number | boolean | string[] | Date | undefined>)[key] = value;
      }
      return acc;
    }, {} as Partial<CustomerFilterParamsDto>);
    
    onFilterChange(cleanedFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    const emptyFilters: Partial<CustomerFilterParamsDto> = {
      type: undefined,
      status: undefined,
      city: undefined,
      country: undefined,
    };
    setFilters({
      type: undefined,
      status: undefined,
      city: '',
      country: '',
    });
    onFilterChange(emptyFilters);
  };
  
  return (
    <Card className="border border-muted bg-background shadow-sm">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-green-600" />
            Filter Customers
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="h-8 px-2 text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Customer Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="type-filter" className="flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-green-600" />
              Customer Type
            </Label>
            <Select 
              value={filters.type || ''} 
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value={CustomerType.INDIVIDUAL}>Individual</SelectItem>
                <SelectItem value={CustomerType.BUSINESS}>Business</SelectItem>
                <SelectItem value={CustomerType.GOVERNMENT}>Government</SelectItem>
                <SelectItem value={CustomerType.NON_PROFIT}>Non-Profit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Customer Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              Status
            </Label>
            <Select 
              value={filters.status || ''} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">All Statuses</SelectItem>
                <SelectItem value={CommonStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={CommonStatus.INACTIVE}>Inactive</SelectItem>
                <SelectItem value={CommonStatus.DELETED}>Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* City Filter */}
          <div className="space-y-2">
            <Label htmlFor="city-filter" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-green-600" />
              City
            </Label>
            <Input 
              id="city-filter" 
              placeholder="Filter by city" 
              value={filters.city || ''} 
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
          </div>
          
          {/* Country Filter */}
          <div className="space-y-2">
            <Label htmlFor="country-filter" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-green-600" />
              Country
            </Label>
            <Input 
              id="country-filter" 
              placeholder="Filter by country" 
              value={filters.country || ''} 
              onChange={(e) => handleFilterChange('country', e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={resetFilters} 
              className={EntityColors.customers.text}
            >
              Reset
            </Button>
            <Button 
              onClick={applyFilters} 
              className={`ml-auto ${EntityColors.customers.primary}`}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};