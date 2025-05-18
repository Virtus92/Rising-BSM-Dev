'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EntityColors, getCustomerTypeBadgeColor, getEntityButtonStyles } from '@/shared/utils/entity-colors';
// Import components directly to avoid Symbol export errors
import { BaseListComponent } from '@/shared/components/data/BaseListComponent';
import type { ColumnDef, CardProps } from '@/shared/components/data/BaseListComponent';
import { BaseCard } from '@/shared/components/data/BaseCard';
import { CustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { useCustomers } from '../hooks/useCustomers';
import { useCustomerPermissions } from '../hooks/useCustomerPermissions';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { formatPhoneNumber } from '@/core/validation/userValidation';
import { CustomerFilterPanel } from './CustomerFilterPanel';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Edit, Trash2, Eye, Phone, Mail, User } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';

// Extended customer type with permission data
interface EnhancedCustomerDto extends CustomerDto {
  permissions?: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

// Props for CustomerList component
export interface CustomerListProps {
  onCreateClick?: () => void;
  showCreateButton?: boolean;
}

// Card component for mobile view - defined outside the main component to ensure stable reference
const CustomerCard = ({ item, onActionClick }: CardProps<EnhancedCustomerDto>) => {
  return (
    <BaseCard
      item={item}
      title={item.name}
      description={item.email || 'No email provided'}
      className={`border-l-4 ${EntityColors.customers.border}`}
      badges={[
        {
          text: item.typeLabel || item.type,
          className: getCustomerTypeBadgeColor(item.type)
        }
      ]}
      fields={[
        {
          label: 'Phone',
          value: item.phone ? formatPhoneNumber(item.phone) : 'Not provided',
          icon: <Phone className="h-4 w-4 text-green-600" />
        },
        {
          label: 'Email',
          value: item.email || 'Not provided',
          icon: <Mail className="h-4 w-4 text-green-600" />
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
      actions={
        <div className="flex justify-between space-x-2">
          {item.permissions?.canView && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onActionClick?.('view', item)}
              className={EntityColors.customers.text}
            >
              <Eye className="h-4 w-4 mr-1.5" /> View
            </Button>
          )}
          {item.permissions?.canEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onActionClick?.('edit', item)}
              className={EntityColors.customers.text}
            >
              <Edit className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          )}
          {item.permissions?.canDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onActionClick?.('delete', item)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/10"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          )}
        </div>
      }
    />
  );
};

/**
 * Customer list component using the unified list utilities
 */
export const CustomerList: React.FC<CustomerListProps> = ({ onCreateClick, showCreateButton = true }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useCustomerPermissions();
  const [showFilters, setShowFilters] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: number; name: string } | null>(null);
  
  // Permission checks
  const canViewCustomer = hasPermission('customers.view');
  const canEditCustomer = hasPermission('customers.edit');
  const canDeleteCustomer = hasPermission('customers.delete');
  const canCreateCustomer = hasPermission('customers.create');
  
  // Use the customers hook with the new unified utilities
  const { 
    customers, 
    isLoading, 
    error, 
    pagination, 
    filters,
    updateFilters,
    setPage,
    setSearch,
    deleteCustomer,
    refetch 
  } = useCustomers();
  
  // Enhance customers with permissions to use in the card component
  const enhancedCustomers: EnhancedCustomerDto[] = customers.map(customer => ({
    ...customer,
    permissions: {
      canView: canViewCustomer,
      canEdit: canEditCustomer,
      canDelete: canDeleteCustomer
    }
  }));
  
  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      const success = await deleteCustomer(customerToDelete.id);
      if (success) {
        toast({
          title: 'Success',
          description: `${customerToDelete.name} has been deleted.`,
          variant: 'success'
        });
      }
    } catch (error) {
      // Handle any errors
      toast({
        title: 'Error',
        description: `Failed to delete customer: ${customerToDelete.name}`,
        variant: 'destructive'
      });
    } finally {
      // Always reset the state regardless of success or failure
      setCustomerToDelete(null);
    }
  };
  
  // Handle filter panel changes
  const handleFilterChange = useCallback((newFilters: Partial<CustomerFilterParamsDto>) => {
    updateFilters(newFilters);
  }, [updateFilters]);
  
  // Handle card action clicks
  const handleCardAction = useCallback((action: string, customer: EnhancedCustomerDto) => {
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
  
  // Function to get type badge color class - using our utility
  const getTypeColorClass = getCustomerTypeBadgeColor;
  
  // Define columns for the table view
  const columns: ColumnDef<EnhancedCustomerDto>[] = [
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
        <Badge className={getTypeColorClass(customer.type)}>
          {customer.typeLabel || customer.type}
        </Badge>
      ),
      sortable: true
    }
  ];
  
  // Define row actions for the table
  const rowActions = useCallback((customer: EnhancedCustomerDto) => (
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
  
  // Handle sort change
  const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
    updateFilters({ 
      sortBy: column, 
      sortDirection: direction 
    });
  }, [updateFilters]);
  
  return (
    <>
      <BaseListComponent<EnhancedCustomerDto>
        // Data props
        items={enhancedCustomers}
        isLoading={isLoading}
        error={error}
        totalItems={pagination?.total || 0}
        currentPage={pagination?.page || 1}
        totalPages={pagination?.totalPages || 1}
        pageSize={pagination?.limit || 10}
        
        // Configuration
        columns={columns}
        keyExtractor={(item) => item.id}
        cardComponent={CustomerCard}
        
        // UI elements
        title="Customers"
        searchPlaceholder="Search customers..."
        emptyStateMessage="No customers found"
        createButtonLabel="Add New Customer"
        showCreateButton={showCreateButton && canCreateCustomer}
        
        // Active filters
        activeFilters={activeFilters.length > 0 ? activeFilters : undefined}
        
        // Actions
        onPageChange={setPage}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onCreateClick={canCreateCustomer ? (onCreateClick || (() => router.push('/dashboard/customers/new'))) : undefined}
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
        onActionClick={handleCardAction}
        
        // Filter panel
        filterPanel={
          <CustomerFilterPanel 
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />
        }
        showFilters={showFilters}
        
        // Sort state
        sortColumn={filters.sortBy}
        sortDirection={filters.sortDirection}
        
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
};
