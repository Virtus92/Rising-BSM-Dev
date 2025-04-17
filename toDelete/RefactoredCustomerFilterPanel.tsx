'use client';

import { useState, useEffect } from 'react';
import { CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';

interface CustomerFilterPanelProps {
  onFilterChange: (filters: Partial<CustomerFilterParamsDto>) => void;
  initialFilters?: Partial<CustomerFilterParamsDto>;
}

export function RefactoredCustomerFilterPanel({ 
  onFilterChange, 
  initialFilters = {} 
}: CustomerFilterPanelProps) {
  // Local state for filter values
  const [filters, setFilters] = useState<Partial<CustomerFilterParamsDto>>({
    type: initialFilters.type || undefined,
    status: initialFilters.status || undefined,
    city: initialFilters.city || '',
    country: initialFilters.country || ''
  });
  
  // Update local state when initialFilters change
  useEffect(() => {
    setFilters({
      type: initialFilters.type || undefined,
      status: initialFilters.status || undefined,
      city: initialFilters.city || '',
      country: initialFilters.country || ''
    });
  }, [initialFilters]);
  
  // Handle filter changes
  const handleChange = (key: keyof CustomerFilterParamsDto, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    // Clean up empty string values
    const cleanedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined) {
        acc[key as keyof CustomerFilterParamsDto] = value;
      }
      return acc;
    }, {} as Partial<CustomerFilterParamsDto>);
    
    onFilterChange(cleanedFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: undefined,
      status: undefined,
      city: '',
      country: ''
    });
    
    onFilterChange({
      type: undefined,
      status: undefined,
      city: undefined,
      country: undefined
    });
  };
  
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Customer Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Type</label>
            <Select
              value={filters.type || ''}
              onValueChange={(value) => handleChange('type', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value={CustomerType.INDIVIDUAL}>Individual</SelectItem>
                <SelectItem value={CustomerType.BUSINESS}>Business</SelectItem>
                <SelectItem value={CustomerType.GOVERNMENT}>Government</SelectItem>
                <SelectItem value={CustomerType.NON_PROFIT}>Non-Profit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Customer Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => handleChange('status', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value={CommonStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={CommonStatus.INACTIVE}>Inactive</SelectItem>
                <SelectItem value={CommonStatus.DELETED}>Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* City */}
          <div className="space-y-2">
            <label className="text-sm font-medium">City</label>
            <Input
              placeholder="Filter by city"
              value={filters.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
          
          {/* Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <Input
              placeholder="Filter by country"
              value={filters.country || ''}
              onChange={(e) => handleChange('country', e.target.value)}
            />
          </div>
        </div>
        
        {/* Filter actions */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={resetFilters}
          >
            Reset
          </Button>
          
          <Button
            onClick={applyFilters}
          >
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
