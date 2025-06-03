'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/shared/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { BaseFilterPanel } from './BaseFilterPanel';
import { RequestFilterParamsDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { Mail, CheckCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface RequestFilterPanelProps {
  filters: Partial<RequestFilterParamsDto>;
  onFilterChange: (filters: Partial<RequestFilterParamsDto>) => void;
  onClose?: () => void;
}

export function RequestFilterPanel({ 
  filters: externalFilters, 
  onFilterChange,
  onClose
}: RequestFilterPanelProps) {
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<Partial<RequestFilterParamsDto>>({
    status: externalFilters.status,
    startDate: externalFilters.startDate,
    endDate: externalFilters.endDate,
  });

  // Sync local state with external filters
  useEffect(() => {
    setLocalFilters({
      status: externalFilters.status,
      startDate: externalFilters.startDate,
      endDate: externalFilters.endDate,
    });
  }, [externalFilters.status, externalFilters.startDate, externalFilters.endDate]);

  // Handle filter changes
  const handleFilterChange = (key: keyof RequestFilterParamsDto, value: any) => {
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
    onFilterChange(localFilters);
    if (onClose) onClose();
  };

  // Reset filters
  const handleReset = () => {
    const resetFilters = {
      status: undefined,
      startDate: undefined,
      endDate: undefined,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Format date for input
  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  };

  return (
    <BaseFilterPanel
      title="Filter Requests"
      icon={<Mail className="h-5 w-5 text-orange-600" />}
      onApply={handleApply}
      onReset={handleReset}
      themeColor="orange"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-orange-600" />
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
              {Object.values(RequestStatus).map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            From Date
          </Label>
          <Input 
            type="date"
            value={formatDateForInput(localFilters.startDate)}
            onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            To Date
          </Label>
          <Input 
            type="date"
            value={formatDateForInput(localFilters.endDate)}
            onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full"
          />
        </div>
      </div>
    </BaseFilterPanel>
  );
}
