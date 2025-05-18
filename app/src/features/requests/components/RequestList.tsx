'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RequestDto, RequestFilterParamsDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { useRequests } from '../hooks/useRequests';
import { EntityColors, getStatusBadgeColor } from '@/shared/utils/entity-colors';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/useToast';
import { Edit, Trash2, Eye, Calendar, Mail, User, FileText, Filter as FilterIcon } from 'lucide-react';
import { format } from 'date-fns';

// Import components directly to avoid Symbol export errors
import { BaseListComponent } from '@/shared/components/data/BaseListComponent';
import type { ColumnDef, CardProps } from '@/shared/components/data/BaseListComponent';
import { BaseCard } from '@/shared/components/data/BaseCard';

export interface RequestListProps {
  initialFilters?: Partial<RequestFilterParamsDto>;
  onCreateClick?: () => void;
  showCreateButton?: boolean;
}

// Enhanced request type to include any additional properties needed for action handling
interface EnhancedRequestDto extends RequestDto {
  // You can add additional properties here if needed
}

// Format date for display - defined outside component for reuse
const formatDate = (date: string | Date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPP');
  } catch (error) {
    return String(date);
  }
};

// Get status badge color using our utility
const getStatusColor = (status: RequestStatus) => {
  return getStatusBadgeColor('requests', status);
};

// Card component for mobile view - defined outside the main component to ensure stable reference
const RequestCard = ({ item, onActionClick }: CardProps<EnhancedRequestDto>) => {
  return (
    <BaseCard
      item={item}
      title={item.name}
      description={item.service || 'General Inquiry'}
      className={`border-l-4 ${EntityColors.requests.border}`}
      badges={[
        {
          text: item.status,
          className: getStatusColor(item.status as RequestStatus)
        }
      ]}
      fields={[
        {
          label: 'Email',
          value: item.email || 'N/A',
          icon: <Mail className="h-4 w-4 text-orange-600" />
        },
        {
          label: 'Phone',
          value: item.phone || 'N/A',
          icon: <User className="h-4 w-4 text-orange-600" />
        },
        {
          label: 'Created',
          value: formatDate(item.createdAt),
          icon: <Calendar className="h-4 w-4 text-orange-600" />
        }
      ]}
      actions={
        <div className="flex justify-between space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onActionClick?.('view', item)}
            className={EntityColors.requests.text}
          >
            <Eye className="h-4 w-4 mr-1.5" /> View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onActionClick?.('edit', item)}
            className={EntityColors.requests.text}
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
 * Request list component using the unified list utilities
 */
export const RequestList: React.FC<RequestListProps> = ({ 
  initialFilters = {}, 
  onCreateClick, 
  showCreateButton 
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [showFilters, setShowFilters] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{ id: number; name: string } | null>(null);
  
  // Use the requests hook with the unified list utilities
  const { 
    requests, 
    isLoading, 
    error, 
    pagination, 
    filters,
    updateFilters,
    setPage,
    setSearch,
    deleteRequest,
    refetch 
  } = useRequests(initialFilters);
  
  // Handle request deletion
  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    try {
      const success = await deleteRequest(requestToDelete.id);
      if (success) {
        toast({
          title: 'Success',
          description: `Request from ${requestToDelete.name} has been deleted.`,
          variant: 'success'
        });
      }
    } catch (error) {
      // Handle any errors
      toast({
        title: 'Error',
        description: `Failed to delete request from ${requestToDelete.name}`,
        variant: 'destructive'
      });
    } finally {
      // Always reset the state regardless of success or failure
      setRequestToDelete(null);
    }
  };
  
  // Handle card action clicks
  const handleCardAction = useCallback((action: string, request: EnhancedRequestDto) => {
    switch (action) {
      case 'view':
        router.push(`/dashboard/requests/${request.id}`);
        break;
      case 'edit':
        router.push(`/dashboard/requests/${request.id}/edit`);
        break;
      case 'delete':
        setRequestToDelete({ 
          id: Number(request.id), 
          name: request.name 
        });
        break;
    }
  }, [router]);
  
  // Define columns for the table view
  const columns: ColumnDef<EnhancedRequestDto>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      sortable: true
    },
    {
      header: 'Email',
      accessorKey: 'email',
      sortable: true
    },
    {
      header: 'Service',
      accessorKey: 'service',
      sortable: true
    },
    {
      header: 'Status',
      cell: (request) => (
        <Badge className={getStatusColor(request.status as RequestStatus)}>
          {request.status}
        </Badge>
      ),
      sortable: true
    },
    {
      header: 'Created At',
      cell: (request) => formatDate(request.createdAt),
      sortable: true
    }
  ];
  
  // Define row actions for the table
  const rowActions = useCallback((request: EnhancedRequestDto) => (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="outline" 
        size="icon" 
        title="View Details"
        onClick={() => router.push(`/dashboard/requests/${request.id}`)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        title="Edit Request"
        onClick={() => router.push(`/dashboard/requests/${request.id}/edit`)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="destructive" 
        size="icon" 
        title="Delete Request"
        onClick={() => setRequestToDelete({ 
          id: Number(request.id), 
          name: request.name 
        })}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ), [router]);
  
  // Create active filters array for display
  const activeFilters = [];
  
  if (filters.status) {
    activeFilters.push({
      label: 'Status',
      value: filters.status,
      onRemove: () => updateFilters({ status: undefined })
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
      <BaseListComponent<EnhancedRequestDto>
        // Data props
        items={requests}
        isLoading={isLoading}
        error={error}
        totalItems={pagination?.total || 0}
        currentPage={pagination?.page || 1}
        totalPages={pagination?.totalPages || 1}
        pageSize={pagination?.limit || 10}
        
        // Configuration
        columns={columns}
        keyExtractor={(item) => item.id}
        cardComponent={RequestCard}
        
        // UI elements
        title="Requests"
        searchPlaceholder="Search requests..."
        emptyStateMessage="No contact requests found"
        
        // Active filters
        activeFilters={activeFilters.length > 0 ? activeFilters : undefined}
        
        // Actions
        onPageChange={setPage}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onRefresh={() => refetch()}
        onFilterToggle={() => setShowFilters(!showFilters)}
        onClearAllFilters={() => {
          updateFilters({
            search: undefined,
            status: undefined
          });
        }}
        onActionClick={handleCardAction}
        
        // Conditionally render the create button based on the prop
        createButtonLabel={showCreateButton ? "New Request" : undefined}
        onCreateClick={showCreateButton && onCreateClick ? onCreateClick : undefined}
        
        
        // Sort state
        sortColumn={filters.sortBy}
        sortDirection={filters.sortDirection}
        
        // Row actions
        rowActions={rowActions}
      />
      
      {/* Delete confirmation dialog */}
      {requestToDelete && (
        <DeleteConfirmationDialog
          title="Delete Request"
          description={`Are you sure you want to delete the request from ${requestToDelete.name}? This action cannot be undone.`}
          onConfirm={handleDeleteRequest}
          onClose={() => setRequestToDelete(null)}
          open={!!requestToDelete}
        />
      )}
    </>
  );
};
