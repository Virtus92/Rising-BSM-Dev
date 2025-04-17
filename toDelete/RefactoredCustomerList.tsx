'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BaseListComponent, 
  ColumnDef,
  BaseCard,
} from '@/shared/utils/list';
import { useCustomerPermissions } from '../hooks/useCustomerPermissions';
import { CustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { CustomerService } from '@/infrastructure/clients/CustomerService';
import { CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { useBaseList } from '@/shared/hooks/useBaseList';
import { Button } from '@/shared/components/ui/button';
import { Edit, Trash2, Eye, Phone, Mail, User } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { formatPhoneNumber } from '@/infrastructure/common/validation/userValidation';
import { useToast } from '@/shared/hooks/useToast';
import { CustomerFilterPanel } from './CustomerFilterPanel';

const CustomerCard = ({ item, onActionClick }: { item: CustomerDto; onActionClick?: (action: string, item: CustomerDto) => void }) => {
  const { hasPermission } = useCustomerPermissions();
  const canViewCustomer = hasPermission('customers.view');
  const canEditCustomer = hasPermission('customers.edit');
  const canDeleteCustomer = hasPermission('customers.delete');
  
  // Define actions for the card
  const actions = (
    <div className="flex justify-between space-x-2">
      {canViewCustomer && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onActionClick?.('view', item)}
        >
          <Eye className="h-4 w-4 mr-1.5" /> View
        </Button>
      )}
      {canEditCustomer && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onActionClick?.('edit', item)}
        >
          <Edit className="h-4 w-4 mr-1.5" /> Edit
        </Button>
      )}
      {canDeleteCustomer && (
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onActionClick?.('delete', item)}
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete
        </Button>
      )}
    </div>
  );

  // Get customer type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case CustomerType.INDIVIDUAL:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case CustomerType.BUSINESS:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case CustomerType.GOVERNMENT:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case CustomerType.NON_PROFIT:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <BaseCard
      item={item}
      title={item.name}
      description={item.email || 'No email provided'}
      badges={[
        {
          text: item.typeLabel || item.type,
          className: getTypeColor(item.type)
        }
      ]}
      fields={[
        {
          label: 'Phone',
          value: item.phone ? formatPhoneNumber(item.phone) : 'Not provided',
          icon: <Phone className="h-4 w-4" />
        },
        {
          label: 'Email',
          value: item.email || 'Not provided',
          icon: <Mail className="h-4 w-4" />
        },
        {
          label: 'City',
          value: item.city || 'Not provided'
        },
        {
          label: 'Country',
          value: item.country || 'Not provided'
        }
      ]}
      actions={actions}
    />
  );
};

export function RefactoredCustomerList() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useCustomerPermissions();
  const [showFilters, setShowFilters] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: number; name: string } | null>(null);
  
  // Check permissions
  const canViewCustomer = hasPermission('customers.view');
  const canEditCustomer = hasPermission('customers.edit');
  const canDeleteCustomer = hasPermission('customers.delete');
  const canCreateCustomer = hasPermission('customers.create');
  
  // Define the fetch function for the customer list
  const fetchCustomers = useCallback(async (filters: CustomerFilterParamsDto) => {
    return await CustomerService.getCustomers(filters);
  }, []);
  
  // Use the base list hook
  const { 
    items: customers, 
    isLoading, 
    error, 
    pagination, 
    filters,
    updateFilters,
    setPage,
    setSearch,
    refetch
  } = useBaseList<CustomerDto, CustomerFilterParamsDto>({
    fetchFunction: fetchCustomers,
    initialFilters: {
      page: 1,
      limit: 10,
      sortBy: 'name',
      sortDirection: 'asc'
    },
    syncWithUrl: true,
    urlFilterConfig: {
      numeric: ['page', 'limit'],
      enum: {
        type: Object.values(CustomerType),
        status: Object.values(CommonStatus)
      }
    }
  });
  
  // Handle customer deletion
  const handleDeleteCustomer = useCallback(async () => {
    if (!customerToDelete) return;
    
    try {
      const response = await CustomerService.deleteCustomer(customerToDelete.id);
      
      if (response.success) {
        toast({
          title: 'Customer deleted',
          description: `${customerToDelete.name} has been successfully deleted.`,
          variant: 'success'
        });
        
        // Refresh the list
        refetch();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete customer',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setCustomerToDelete(null);
    }
  }, [customerToDelete, toast, refetch]);
  
  // Handle filter changes from the filter panel
  const handleFilterChange = useCallback((newFilters: Partial<CustomerFilterParamsDto>) => {
    updateFilters(newFilters);
  }, [updateFilters]);
  
  // Handle card action clicks
  const handleCardAction = useCallback((action: string, customer: CustomerDto) => {
    switch (action) {
      case 'view':
        router.push(`/dashboard/customers/${customer.id}`);
        break;
      case 'edit':
        router.push(`/dashboard/customers/${customer.id}/edit`);
        break;
      case 'delete':
        setCustomerToDelete({ id: Number(customer.id), name: customer.name });
        break;
    }
  }, [router]);
  
  // Define columns for the table view
  const columns: ColumnDef<CustomerDto>[] = [
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
      header: 'Phone',
      cell: (customer) => customer.phone ? formatPhoneNumber(customer.phone) : '-',
      sortable: true
    },
    {
      header: 'Type',
      cell: (customer) => (
        <Badge className={`${getTypeColorClass(customer.type)}`}>
          {customer.typeLabel || customer.type}
        </Badge>
      ),
      sortable: true
    }
  ];
  
  // Define row actions for the table
  const rowActions = useCallback((customer: CustomerDto) => (
    <div className="flex justify-end space-x-2">
      {canViewCustomer && (
        <Link href={`/dashboard/customers/${customer.id}`}>
          <Button 
            variant="outline" 
            size="icon" 
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      )}
      
      {canEditCustomer && (
        <Link href={`/dashboard/customers/${customer.id}/edit`}>
          <Button 
            variant="outline" 
            size="icon" 
            title="Edit Customer"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      )}
      
      {canDeleteCustomer && (
        <Button 
          variant="destructive" 
          size="icon" 
          title="Delete Customer"
          onClick={() => setCustomerToDelete({ 
            id: Number(customer.id), 
            name: customer.name 
          })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  ), [canViewCustomer, canEditCustomer, canDeleteCustomer]);
  
  // Helper function to get type badge color class
  const getTypeColorClass = (type: string) => {
    switch (type) {
      case CustomerType.INDIVIDUAL:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case CustomerType.BUSINESS:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case CustomerType.GOVERNMENT:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case CustomerType.NON_PROFIT:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  
  // Create active filters array for display
  const activeFilters = [];
  
  if (filters.type) {
    activeFilters.push({
      label: 'Type',
      value: filters.type,
      onRemove: () => updateFilters({ type: undefined })
    });
  }
  
  if (filters.status) {
    activeFilters.push({
      label: 'Status',
      value: filters.status,
      onRemove: () => updateFilters({ status: undefined })
    });
  }
  
  if (filters.city) {
    activeFilters.push({
      label: 'City',
      value: filters.city,
      onRemove: () => updateFilters({ city: undefined })
    });
  }
  
  if (filters.country) {
    activeFilters.push({
      label: 'Country',
      value: filters.country,
      onRemove: () => updateFilters({ country: undefined })
    });
  }
  
  if (filters.search) {
    activeFilters.push({
      label: 'Search',
      value: filters.search,
      onRemove: () => updateFilters({ search: undefined })
    });
  }
  
  return (
    <>
      <BaseListComponent<CustomerDto>
        // Data props
        items={customers}
        isLoading={isLoading}
        error={error}
        totalItems={pagination.total}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        pageSize={pagination.limit}
        
        // Configuration
        columns={columns}
        keyExtractor={(item) => item.id}
        cardComponent={({ item, onActionClick }) => (
          <CustomerCard 
            item={item} 
            onActionClick={(action, item) => handleCardAction(action, item)} 
          />
        )}
        
        // UI elements
        title="Customers"
        searchPlaceholder="Search customers..."
        emptyStateMessage="No customers found"
        createButtonLabel="Add Customer"
        
        // Active filters
        activeFilters={activeFilters.length > 0 ? activeFilters : undefined}
        
        // Actions
        onPageChange={setPage}
        onSearchChange={setSearch}
        onCreateClick={canCreateCustomer ? () => router.push('/dashboard/customers/new') : undefined}
        onRefresh={() => refetch()}
        onFilterToggle={() => setShowFilters(!showFilters)}
        onClearAllFilters={() => {
          updateFilters({
            search: undefined,
            type: undefined,
            status: undefined,
            city: undefined,
            country: undefined
          });
        }}
        
        // Filter panel
        filterPanel={
          <CustomerFilterPanel 
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />
        }
        showFilters={showFilters}
        
        // Row actions
        rowActions={rowActions}
      />
      
      {/* Delete confirmation dialog */}
      {customerToDelete && (
        <DeleteConfirmationDialog
          title="Delete Customer"
          description={`Are you sure you want to delete ${customerToDelete.name}? This action cannot be undone.`}
          onConfirm={handleDeleteCustomer}
          onClose={() => setCustomerToDelete(null)}
          open={!!customerToDelete}
        />
      )}
    </>
  );
}
