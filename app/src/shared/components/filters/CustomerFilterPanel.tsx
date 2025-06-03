'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { BaseFilterPanel } from '@/shared/components/filters/BaseFilterPanel';
import { CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { UserPlus, CheckCircle, MapPin, Globe, Mail } from 'lucide-react';

interface CustomerFilterPanelProps {
  filters: Partial<CustomerFilterParamsDto>;
  onFilterChange: (filters: Partial<CustomerFilterParamsDto>) => void;
  onClose?: () => void;
}

export const CustomerFilterPanel = ({ 
  filters: externalFilters, 
  onFilterChange,
  onClose
}: CustomerFilterPanelProps) => {
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<Partial<CustomerFilterParamsDto>>({
    type: externalFilters.type,
    status: externalFilters.status,
    city: externalFilters.city || '',
    country: externalFilters.country || '',
    newsletter: externalFilters.newsletter,
  });
  
  // Sync local state with external filters
  useEffect(() => {
    setLocalFilters({
      type: externalFilters.type,
      status: externalFilters.status,
      city: externalFilters.city || '',
      country: externalFilters.country || '',
      newsletter: externalFilters.newsletter,
    });
  }, [externalFilters.type, externalFilters.status, externalFilters.city, externalFilters.country, externalFilters.newsletter]);
  
  // Handle filter change
  const handleFilterChange = (key: keyof CustomerFilterParamsDto, value: any) => {
    // Handle different input types
    let newValue;
    if (typeof value === 'string') {
      newValue = value === 'all' || value === '' ? undefined : value;
    } else {
      newValue = value;
    }
    setLocalFilters(prev => ({ ...prev, [key]: newValue }));
  };
  
  // Apply filters
  const handleApply = () => {
    // Clean up empty values
    const cleanedFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined) {
        (acc as any)[key] = value;
      }
      return acc;
    }, {} as Partial<CustomerFilterParamsDto>);
    
    onFilterChange(cleanedFilters);
    if (onClose) onClose();
  };
  
  // Reset filters
  const handleReset = () => {
    const resetFilters = {
      type: undefined,
      status: undefined,
      city: undefined,
      country: undefined,
      newsletter: undefined,
    };
    setLocalFilters({
      type: undefined,
      status: undefined,
      city: '',
      country: '',
      newsletter: undefined,
    });
    onFilterChange(resetFilters);
  };
  
  return (
    <BaseFilterPanel
      title="Filter Customers"
      icon={<UserPlus className="h-5 w-5 text-green-600" />}
      onApply={handleApply}
      onReset={handleReset}
      themeColor="green"
    >
        
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-green-600" />
            Customer Type
          </Label>
          <Select 
            value={localFilters.type || 'all'} 
            onValueChange={(value) => handleFilterChange('type', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={CustomerType.INDIVIDUAL}>Individual</SelectItem>
              <SelectItem value={CustomerType.BUSINESS}>Business</SelectItem>
              <SelectItem value={CustomerType.GOVERNMENT}>Government</SelectItem>
              <SelectItem value={CustomerType.NON_PROFIT}>Non-Profit</SelectItem>
            </SelectContent>
          </Select>
        </div>
          
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Status
          </Label>
          <Select 
            value={localFilters.status || 'all'} 
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={CommonStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={CommonStatus.INACTIVE}>Inactive</SelectItem>
              <SelectItem value={CommonStatus.DELETED}>Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
          
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            City
          </Label>
          <Input 
            placeholder="Filter by city" 
            value={localFilters.city || ''} 
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="w-full"
          />
        </div>
          
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-green-600" />
            Country
          </Label>
          <Input 
            placeholder="Filter by country" 
            value={localFilters.country || ''} 
            onChange={(e) => handleFilterChange('country', e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-600" />
            Newsletter
          </Label>
          <div className="flex items-center space-x-2">
            <Switch 
              id="newsletter-filter"
              checked={localFilters.newsletter || false}
              onCheckedChange={(checked) => handleFilterChange('newsletter', checked ? true : undefined)}
            />
            <Label htmlFor="newsletter-filter" className="text-sm font-normal cursor-pointer">
              Subscribed only
            </Label>
          </div>
        </div>
      </div>
    </BaseFilterPanel>
  );
};