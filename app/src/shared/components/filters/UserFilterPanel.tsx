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
import { BaseFilterPanel } from './BaseFilterPanel';
import { UserFilterParamsDto } from '@/domain/dtos/UserDtos';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { Users, CheckCircle } from 'lucide-react';

interface UserFilterPanelProps {
  filters: Partial<UserFilterParamsDto>;
  onFilterChange: (filters: Partial<UserFilterParamsDto>) => void;
  onClose?: () => void;
}

export function UserFilterPanel({ 
  filters: externalFilters, 
  onFilterChange,
  onClose
}: UserFilterPanelProps) {
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<Partial<UserFilterParamsDto>>({
    role: externalFilters.role,
    status: externalFilters.status,
  });

  // Sync local state with external filters
  useEffect(() => {
    setLocalFilters({
      role: externalFilters.role,
      status: externalFilters.status,
    });
  }, [externalFilters.role, externalFilters.status]);

  // Handle filter changes
  const handleFilterChange = (key: keyof UserFilterParamsDto, value: string | undefined) => {
    const newValue = value === 'all' ? undefined : value;
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
      role: undefined,
      status: undefined,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <BaseFilterPanel
      title="Filter Users"
      icon={<Users className="h-5 w-5 text-purple-600" />}
      onApply={handleApply}
      onReset={handleReset}
      themeColor="purple"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Role
          </Label>
          <Select 
            value={localFilters.role || 'all'} 
            onValueChange={(value) => handleFilterChange('role', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.values(UserRole).map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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
              {Object.values(UserStatus).map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </BaseFilterPanel>
  );
}
