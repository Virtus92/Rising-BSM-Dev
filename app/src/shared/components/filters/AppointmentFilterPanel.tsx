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
import { AppointmentFilterParamsDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentFilterPanelProps {
  filters: Partial<AppointmentFilterParamsDto>;
  onFilterChange: (filters: Partial<AppointmentFilterParamsDto>) => void;
  onClose?: () => void;
}

export function AppointmentFilterPanel({ 
  filters: externalFilters, 
  onFilterChange,
  onClose
}: AppointmentFilterPanelProps) {
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<Partial<AppointmentFilterParamsDto>>({
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
  const handleFilterChange = (key: keyof AppointmentFilterParamsDto, value: any) => {
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
      title="Filter Appointments"
      icon={<Calendar className="h-5 w-5 text-purple-600" />}
      onApply={handleApply}
      onReset={handleReset}
      themeColor="purple"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-purple-600" />
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
              {Object.values(AppointmentStatus).map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
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
            <Calendar className="h-4 w-4 text-purple-600" />
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
