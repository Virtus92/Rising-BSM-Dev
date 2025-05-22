'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EntityColors, getCustomerTypeBadgeColor, getStatusBadgeColor } from '@/shared/utils/entity-colors';
import { BaseListComponent } from '@/shared/components/data/BaseListComponent';
import type { ColumnDef, CardProps } from '@/shared/components/data/BaseListComponent';
import { BaseCard } from '@/shared/components/data/BaseCard';
import { CustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { useCustomers } from '../hooks/useCustomers';
import { useCustomerPermissions } from '../hooks/useCustomerPermissions';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { formatPhoneNumber } from '@/core/validation/userValidation';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Edit, Trash2, Eye, Phone, Mail, Building2, MapPin, Filter, Check, X } from 'lucide-react';
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
  onActionClick?: (action: string, customer?: CustomerDto) => void;
}

// Card component for mobile view - defined outside the main component to ensure stable reference
const CustomerCard = ({ item, onActionClick }: CardProps<EnhancedCustomerDto>) => {
  return (
    <BaseCard
      item={item}
      title={item.name}
      description={item.email || 'No email provided'}
      className={`border-l-4 ${EntityColors.customers.border} transition-all duration-200 hover:shadow-md hover:border-l-8`}
      status={{
        text: item.status,
        className: getStatusBadgeColor('customers', item.status)
      }}
      badges={[
        {
          text: item.typeLabel || item.type,
          className: getCustomerTypeBadgeColor(item.type)
        }
      ]}
      fields={[
        {
          label: 'Email',
          value: item.email || 'Not provided',
          icon: <Mail className="h-4 w-4 text-green-600" />
        },
        {
          label: 'Phone',
          value: item.phone ? formatPhoneNumber(item.phone) : 'Not provided',
          icon: <Phone className="h-4 w-4 text-green-600" />
        },
        {
          label: 'Company',
          value: item.company || 'Not provided',
          icon: <Building2 className="h-4 w-4 text-green-600" />
        },
        {
          label: 'Location',
          value: item.city && item.country ? `${item.city}, ${item.country}` : (item.city || item.country || 'Not provided'),
          icon: <MapPin className="h-4 w-4 text-green-600" />
        }
      ]}
      actions={
        <div className="flex justify-between space-x-2">
          {item.permissions?.canView && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onActionClick?.('view', item)}
              className={`${EntityColors.customers.text} hover:bg-green-50 dark:hover:bg-green-950/10`}
            >
              <Eye className="h-4 w-4 mr-1.5" /> View
            </Button>
          )}
          {item.permissions?.canEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onActionClick?.('edit', item)}
              className={`${EntityColors.customers.text} hover:bg-green-50 dark:hover:bg-green-950/10`}
            >
              <Edit className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          )}
          {item.permissions?.canDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onActionClick?.('delete', item)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/10 border-red-200 hover:border-red-300"
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
 * Enhanced customer list component with improved design and standardized filtering
 */
export const CustomerList: React.FC<CustomerListProps> = ({ 
  onCreateClick, 
  showCreateButton = true,
  onActionClick
}) => {
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
    setPageSize,
    setSearch,
    setSort,
    deleteCustomer,
    refetch,
    clearAllFilters
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
      toast({
        title: 'Error',
        description: `Failed to delete customer: ${customerToDelete.name}`,
        variant: 'destructive'
      });
    } finally {
      setCustomerToDelete(null);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = useCallback((filterUpdates: Partial<CustomerFilterParamsDto>) => {
    updateFilters({ ...filterUpdates, page: 1 });
  }, [updateFilters]);
  
  // Handle card action clicks
  const handleCardAction = useCallback((action: string, customer: EnhancedCustomerDto) => {
    if (onActionClick) {
      onActionClick(action, customer);
    } else {
      // Fallback to old behavior
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
    }
  }, [onActionClick, router]);
  
  // Function to get type badge color class
  const getTypeColorClass = getCustomerTypeBadgeColor;
  
  // Define columns for the table view
  const columns: ColumnDef<EnhancedCustomerDto>[] = [
    {
      header: 'Customer',
      accessorKey: 'name',
      cell: (customer) => (
        <div className="flex flex-col">
          <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
          {customer.company && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Building2 className="h-3.5 w-3.5 mr-1" />
              {customer.company}
            </div>
          )}
        </div>
      ),
      sortable: true
    },
    {
      header: 'Contact',
      accessorKey: 'email',
      cell: (customer) => (
        <div className="flex flex-col space-y-1">
          {customer.email && (
            <div className="text-sm flex items-center">
              <Mail className="h-3.5 w-3.5 mr-1 text-blue-500" />
              <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                {customer.email}
              </a>
            </div>
          )}
          {customer.phone && (
            <div className="text-sm flex items-center">
              <Phone className="h-3.5 w-3.5 mr-1 text-green-500" />
              <a href={`tel:${customer.phone}`} className="text-green-600 hover:underline">
                {formatPhoneNumber(customer.phone)}
              </a>
            </div>
          )}
        </div>
      ),
      sortable: true
    },
    {
      header: 'Location',
      accessorKey: 'city',
      cell: (customer) => (
        <div className="flex flex-col space-y-1">
          {customer.city && (
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {customer.city}
            </div>
          )}
          {customer.country && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {customer.country}
            </div>
          )}
        </div>
      ),
      sortable: true
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (customer) => (
        <Badge variant="outline" className={getTypeColorClass(customer.type)}>
          {customer.typeLabel || customer.type}
        </Badge>
      ),
      sortable: true
    },
    {
      header: 'Newsletter',
      accessorKey: 'newsletter',
      cell: (customer) => (
        <div className="flex items-center">
          {customer.newsletter ? (
            <div className="flex items-center text-green-600">
              <Check className="h-4 w-4 mr-1" />
              <span className="text-sm">Yes</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-400">
              <X className="h-4 w-4 mr-1" />
              <span className="text-sm">No</span>
            </div>
          )}
        </div>
      ),
      sortable: true
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (customer) => (
        <Badge 
          variant={
            customer.status === CommonStatus.ACTIVE ? 'default' : 
            customer.status === CommonStatus.INACTIVE ? 'secondary' : 
            customer.status === CommonStatus.PENDING ? 'outline' : 
            'destructive'
          }
          className="shadow-sm"
        >
          {customer.statusLabel || customer.status}
        </Badge>
      ),
      sortable: true
    }
  ];
  
  // Define row actions for the table
  const rowActions = useCallback((customer: EnhancedCustomerDto) => (
    <div className="flex justify-end space-x-2">
      {canViewCustomer && (
        <Button 
          variant="outline" 
          size="icon" 
          title="View Details"
          className="hover:bg-green-50 dark:hover:bg-green-950/10"
          onClick={() => handleCardAction('view', customer)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      
      {canEditCustomer && (
        <Button 
          variant="outline" 
          size="icon" 
          title="Edit Customer"
          className="hover:bg-green-50 dark:hover:bg-green-950/10"
          onClick={() => handleCardAction('edit', customer)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      
      {canDeleteCustomer && (
        <Button 
          variant="destructive" 
          size="icon" 
          title="Delete Customer"
          onClick={() => handleCardAction('delete', customer)}
          className="hover:bg-red-600 dark:hover:bg-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  ), [canViewCustomer, canEditCustomer, canDeleteCustomer, handleCardAction]);
  
  // Create active filters array for display
  const activeFilters = [];
  
  if (filters.type) {
    activeFilters.push({
      label: 'Type',
      value: filters.type,
      onRemove: () => handleFilterChange({ type: undefined })
    });
  }
  
  if (filters.status) {
    activeFilters.push({
      label: 'Status',
      value: filters.status,
      onRemove: () => handleFilterChange({ status: undefined })
    });
  }
  
  if (filters.city) {
    activeFilters.push({
      label: 'City',
      value: filters.city,
      onRemove: () => handleFilterChange({ city: undefined })
    });
  }
  
  if (filters.country) {
    activeFilters.push({
      label: 'Country',
      value: filters.country,
      onRemove: () => handleFilterChange({ country: undefined })
    });
  }
  
  if (filters.newsletter !== undefined) {
    activeFilters.push({
      label: 'Newsletter',
      value: filters.newsletter ? 'Subscribed' : 'Not subscribed',
      onRemove: () => handleFilterChange({ newsletter: undefined })
    });
  }
  
  if (filters.search) {
    activeFilters.push({
      label: 'Search',
      value: filters.search,
      onRemove: () => handleFilterChange({ search: undefined })
    });
  }
  
  // Handle sort change
  const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSort(column, direction);
  }, [setSort]);
  
  // Enhanced filter panel with better styling and customer-themed colors
  const filterPanel = (
    <div className="p-6 border rounded-lg mb-6 space-y-6 bg-white dark:bg-gray-800 shadow-sm border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filter Customers</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-green-600" />
            Type
          </label>
          <select 
            className="w-full border rounded-md p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            value={filters.type || ''} 
            onChange={(e) => handleFilterChange({ type: e.target.value ? e.target.value as CustomerType : undefined })}
          >
            <option value="">All Types</option>
            {Object.values(CustomerType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4 text-green-600" />
            Status
          </label>
          <select 
            className="w-full border rounded-md p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            value={filters.status || ''} 
            onChange={(e) => handleFilterChange({ status: e.target.value ? e.target.value as CommonStatus : undefined })}
          >
            <option value="">All Statuses</option>
            {Object.values(CommonStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-600" />
            Newsletter
          </label>
          <select 
            className="w-full border rounded-md p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            value={filters.newsletter === undefined ? '' : filters.newsletter ? 'true' : 'false'} 
            onChange={(e) => handleFilterChange({ 
              newsletter: e.target.value === '' ? undefined : e.target.value === 'true' 
            })}
          >
            <option value="">All Customers</option>
            <option value="true">Subscribed</option>
            <option value="false">Not Subscribed</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            City
          </label>
          <input
            type="text"
            placeholder="Enter city..."
            className="w-full border rounded-md p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            value={filters.city || ''}
            onChange={(e) => handleFilterChange({ city: e.target.value || undefined })}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            Country
          </label>
          <input
            type="text"
            placeholder="Enter country..."
            className="w-full border rounded-md p-3 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            value={filters.country || ''}
            onChange={(e) => handleFilterChange({ country: e.target.value || undefined })}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="outline" 
          className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/10"
          onClick={clearAllFilters}
        >
          Reset Filters
        </Button>
        
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
          onClick={() => setShowFilters(false)}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );

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
        cardComponent={CustomerCard as React.FC<CardProps<EnhancedCustomerDto>>}
        
        // UI elements
        title="Customers"
        searchPlaceholder="Search customers by name, email, or company..."
        emptyStateMessage="No customers found"
        createButtonLabel="Add New Customer"
        showCreateButton={showCreateButton && canCreateCustomer}
        
        // Active filters
        activeFilters={activeFilters.length > 0 ? activeFilters : undefined}
        
        // Actions
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onCreateClick={canCreateCustomer ? (onCreateClick || (() => router.push('/dashboard/customers/new'))) : undefined}
        onRefresh={() => refetch()}
        onFilterToggle={() => setShowFilters(!showFilters)}
        onClearAllFilters={clearAllFilters}
        onActionClick={handleCardAction}
        
        // Filter panel
        filterPanel={filterPanel}
        showFilters={showFilters}
        
        // Sort state
        sortColumn={filters.sortBy}
        sortDirection={filters.sortDirection}
        
        // Row actions
        rowActions={rowActions}
        
        // Enhanced styling
        className="bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/10 dark:to-gray-900"
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
