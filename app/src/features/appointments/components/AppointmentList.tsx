'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentDto, AppointmentFilterParamsDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { useAppointments } from '../hooks/useAppointments';
import { EntityColors, getStatusBadgeColor } from '@/shared/utils/entity-colors';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/useToast';
import { Edit, Trash2, Eye, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

// Import components directly to avoid Symbol export errors
import { BaseListComponent, ColumnDef, CardProps } from '@/shared/components/data/BaseListComponent';
import { BaseCard, BaseCardProps } from '@/shared/components/data/BaseCard';

interface AppointmentListProps {
  initialFilters?: Partial<AppointmentFilterParamsDto>;
  onCreateClick?: () => void;
  showCreateButton?: boolean;
  onActionClick?: (action: string, appointment?: AppointmentDto) => void;
}

// Card component for mobile view - defined outside the main component to ensure stable reference
const AppointmentCard = ({ item, onActionClick }: CardProps<AppointmentDto>) => {
  const customerName = item.customerName || `Customer #${item.customerId}` || 'Unknown Customer';
  
  // Get status badge color using our utility
  const getStatusColor = (status: AppointmentStatus) => {
    return getStatusBadgeColor('appointments', status);
  };
  
  // Format date and time for display
  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'PPP');
    } catch (error) {
      return String(date);
    }
  };
  
  const formatTime = (time: string) => {
    if (!time) return '-';
    return time;
  };
  
  return (
    <BaseCard
      item={item}
      title={item.title}
      description={`With ${customerName}`}
      className={`border-l-4 ${EntityColors.appointments.border}`}
      badges={[
        {
          text: item.status,
          className: getStatusColor(item.status as AppointmentStatus)
        }
      ]}
      fields={[
        {
          label: 'Date',
          value: formatDate(item.appointmentDate),
          icon: <Calendar className="h-4 w-4 text-purple-600" />
        },
        {
          label: 'Time',
          value: formatTime(item.appointmentTime || ''),
          icon: <Clock className="h-4 w-4 text-purple-600" />
        },
        {
          label: 'Customer',
          value: customerName,
          icon: <User className="h-4 w-4 text-purple-600" />
        }
      ]}
      actions={
        <div className="flex justify-between space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onActionClick?.('view', item)}
            className={EntityColors.appointments.text}
          >
            <Eye className="h-4 w-4 mr-1.5" /> View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onActionClick?.('edit', item)}
            className={EntityColors.appointments.text}
          >
            <Edit className="h-4 w-4 mr-1.5" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onActionClick?.('delete', item)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
        </div>
      }
    />
  );
};

/**
 * Appointment list component using the unified list utilities
 */
export const AppointmentList: React.FC<AppointmentListProps> = ({ 
  initialFilters,
  onCreateClick,
  showCreateButton = true,
  onActionClick
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [showFilters, setShowFilters] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<{ id: number; title: string } | null>(null);
  
  // Use the appointments hook with the unified list utilities
  const { 
    appointments, 
    isLoading, 
    error, 
    pagination, 
    filters,
    updateFilters,
    setPage,
    setPageSize,
    setSearch,
    deleteAppointment,
    refetch 
  } = useAppointments(initialFilters);
  
  // Handle appointment deletion
  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    
    try {
      const success = await deleteAppointment(appointmentToDelete.id);
      if (success) {
        toast({
          title: 'Success',
          description: `Appointment has been deleted.`,
          variant: 'success'
        });
      }
    } catch (error) {
      // Handle any errors
      toast({
        title: 'Error',
        description: 'Failed to delete appointment',
        variant: 'destructive'
      });
    } finally {
      setAppointmentToDelete(null);
    }
  };
  
  // Format date and time for display
  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'PPP');
    } catch (error) {
      return String(date);
    }
  };
  
  const formatTime = (time: string) => {
    if (!time) return '-';
    return time;
  };
  
  // Get status badge color
  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PLANNED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case AppointmentStatus.CONFIRMED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case AppointmentStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case AppointmentStatus.RESCHEDULED:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
    }
  };
  
  // Handle card action clicks
  const handleCardAction = useCallback((action: string, appointment: AppointmentDto) => {
    if (onActionClick) {
      onActionClick(action, appointment);
    } else {
      // Fallback to old behavior
      switch (action) {
        case 'view':
          router.push(`/dashboard/appointments/${appointment.id}`);
          break;
        case 'edit':
          router.push(`/dashboard/appointments/edit/${appointment.id}`);
          break;
        case 'delete':
          setAppointmentToDelete({ 
            id: Number(appointment.id), 
            title: appointment.title 
          });
          break;
      }
    }
  }, [onActionClick, router]);
  
  // Define columns for the table view
  const columns: ColumnDef<AppointmentDto>[] = [
    {
      header: 'Title',
      accessorKey: 'title',
      sortable: true
    },
    {
      header: 'Customer',
      cell: (appointment) => appointment.customerName || (appointment.customerId ? `Customer #${appointment.customerId}` : '-'),
      sortable: true
    },
    {
      header: 'Date',
      cell: (appointment) => formatDate(appointment.appointmentDate),
      sortable: true
    },
    {
      header: 'Time',
      cell: (appointment) => formatTime(appointment.appointmentTime || ''),
      sortable: true
    },
    {
      header: 'Status',
      cell: (appointment) => (
        <Badge className={getStatusColor(appointment.status as AppointmentStatus)}>
          {appointment.status}
        </Badge>
      ),
      sortable: true
    }
  ];
  
  // Define row actions for the table
  const rowActions = useCallback((appointment: AppointmentDto) => (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="outline" 
        size="icon" 
        title="View Details"
        onClick={() => handleCardAction('view', appointment)}
        className={EntityColors.appointments.text}
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        title="Edit Appointment"
        onClick={() => handleCardAction('edit', appointment)}
        className={EntityColors.appointments.text}
      >
        <Edit className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="destructive" 
        size="icon" 
        title="Delete Appointment"
        onClick={() => handleCardAction('delete', appointment)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ), [handleCardAction]);
  
  // Create active filters array for display
  const activeFilters = [];
  
  if (filters.status) {
    activeFilters.push({
      label: 'Status',
      value: filters.status,
      onRemove: () => updateFilters({ status: undefined })
    });
  }
  
  if (filters.startDate) {
    activeFilters.push({
      label: 'From',
      value: formatDate(filters.startDate),
      onRemove: () => updateFilters({ startDate: undefined })
    });
  }
  
  if (filters.endDate) {
    activeFilters.push({
      label: 'To',
      value: formatDate(filters.endDate),
      onRemove: () => updateFilters({ endDate: undefined })
    });
  }
  
  if (filters.search) {
    activeFilters.push({
      label: 'Search',
      value: filters.search,
      onRemove: () => updateFilters({ search: undefined })
    });
  }
  
  // Handle sort change
  const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
    updateFilters({ 
      sortBy: column, 
      sortDirection: direction 
    });
  }, [updateFilters]);
  
  return (
    <>
      <BaseListComponent<AppointmentDto>
        // Data props
        items={appointments}
        isLoading={isLoading}
        error={error}
        totalItems={pagination?.total || 0}
        currentPage={pagination?.page || 1}
        totalPages={pagination?.totalPages || 1}
        pageSize={pagination?.limit || 10}
        
        // Configuration
        columns={columns}
        keyExtractor={(item) => item.id}
        cardComponent={AppointmentCard as any}
        
        // UI elements
        title="Appointments"
        searchPlaceholder="Search appointments..."
        emptyStateMessage="No appointments found"
        createButtonLabel="Create Appointment"
        showCreateButton={showCreateButton}
        
        // Active filters
        activeFilters={activeFilters.length > 0 ? activeFilters : undefined}
        
        // Actions
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onCreateClick={onCreateClick || (() => router.push('/dashboard/appointments/create'))}
        onRefresh={() => refetch()}
        onFilterToggle={() => setShowFilters(!showFilters)}
        onClearAllFilters={() => {
          updateFilters({
            search: undefined,
            status: undefined,
            startDate: undefined,
            endDate: undefined
          });
        }}
        onActionClick={handleCardAction}
        
        // Sort state
        sortColumn={filters.sortBy}
        sortDirection={filters.sortDirection}
        
        // Row actions
        rowActions={rowActions}
      />
      
      {/* Delete confirmation dialog */}
      {appointmentToDelete && (
        <DeleteConfirmationDialog
          title="Delete Appointment"
          description={`Are you sure you want to delete "${appointmentToDelete.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteAppointment}
          onClose={() => setAppointmentToDelete(null)}
          open={!!appointmentToDelete}
        />
      )}
    </>
  );
};

export default AppointmentList;
