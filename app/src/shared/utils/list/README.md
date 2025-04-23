# Unified List Utilities

This module provides a standardized approach to building list-based UIs in the application, solving many common problems:

- Inconsistent implementation of pagination, sorting, filtering, and searching
- Duplication of list-related logic across components
- Limited reusability of list components
- Inconsistent UI patterns for lists

## Components Overview

### Core Utilities

- **`baseListUtils.ts`**: Contains utility functions for manipulating list data
- **`useBaseList.ts`**: Hook for managing list state with consistent pagination, filtering, etc.
- **`BaseListComponent.tsx`**: Reusable UI component for displaying lists with consistent patterns
- **`BaseCard.tsx`**: Card component for displaying list items in card view (mobile friendly)

## Usage Guide

### Step 1: Create a Feature-Specific Hook

Create a custom hook for your feature that uses `useBaseList`:

```typescript
// useCustomers.ts
import { useBaseList } from '@/shared/utils/list';
import { CustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { CustomerService } from '@/infrastructure/clients/CustomerService';

export function useCustomers(initialFilters?: CustomerFilterParamsDto) {
  // Define fetch function
  const fetchCustomers = async (filters: CustomerFilterParamsDto) => {
    return await CustomerService.getCustomers(filters);
  };
  
  // Use the base list hook
  return useBaseList<CustomerDto, CustomerFilterParamsDto>({
    fetchFunction: fetchCustomers,
    initialFilters: {
      page: 1,
      limit: 10,
      ...initialFilters
    },
    syncWithUrl: true // Sync filters with URL parameters
  });
}
```

### Step 2: Create a Feature-Specific Card Component

Create a card component for mobile views:

```tsx
// CustomerCard.tsx
import { BaseCard } from '@/shared/utils/list';
import { CustomerDto } from '@/domain/dtos/CustomerDtos';

export function CustomerCard({ item, onActionClick }) {
  return (
    <BaseCard
      item={item}
      title={item.name}
      description={item.email}
      fields={[
        { label: 'Phone', value: item.phone },
        { label: 'Type', value: item.type }
      ]}
      actions={/* Your action buttons */}
    />
  );
}
```

### Step 3: Use BaseListComponent in Your Feature

```tsx
// CustomerList.tsx
import { BaseListComponent, ColumnDef } from '@/shared/utils/list';
import { useCustomers } from './useCustomers';
import { CustomerCard } from './CustomerCard';
import { CustomerDto } from '@/domain/dtos/CustomerDtos';

export function CustomerList() {
  const { 
    items: customers, 
    isLoading, 
    error, 
    pagination, 
    setPage,
    setSearch,
    setSort
  } = useCustomers();
  
  // Define columns for table view
  const columns: ColumnDef<CustomerDto>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      sortable: true
    },
    {
      header: 'Email',
      accessorKey: 'email'
    },
    // More columns...
  ];
  
  return (
    <BaseListComponent
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
      cardComponent={CustomerCard}
      
      // Actions
      onPageChange={setPage}
      onSearchChange={setSearch}
      onSortChange={setSort}
      
      // UI customization
      title="Customers"
      searchPlaceholder="Search customers..."
    />
  );
}
```

## Advanced Features

### URL Synchronization

The list utilities support automatic synchronization with URL parameters, allowing:

- Bookmarkable list states (search, filters, pagination, sorting)
- Shareable URLs with list state preserved
- Browser navigation (back/forward) through list states

Example URL: `/customers?page=2&search=acme&type=business&sortBy=name&sortDirection=asc`

To enable URL synchronization:

```typescript
useBaseList({
  // ...
  syncWithUrl: true,
  // Configure how URL parameters should be parsed
  urlFilterConfig: {
    numeric: ['page', 'limit'],
    boolean: ['showInactive'],
    enum: {
      type: Object.values(CustomerType)
    }
  }
});
```

### Type-Safe Filter Helpers

The utilities provide type-safe filter operations that ensure all filter operations are properly typed:

```typescript
// All of these methods are fully typed
updateFilters({ type: 'business' }); // Only valid enum values can be used
setPage(2); // Must be a number
setSort('name', 'asc'); // Only valid properties and directions
```

### Responsive Design

The `BaseListComponent` automatically handles responsive views:

- Table view on desktop
- Card view on mobile
- User-toggleable view mode

## Best Practices

1. **Create a Feature-Specific Hook**: Always wrap `useBaseList` in a feature-specific hook to add domain-specific functionality.

2. **Handle Empty and Error States**: Both are handled automatically by `BaseListComponent`, but can be customized.

3. **Use Type-Safe Columns**: Define columns with `ColumnDef<T>` for type safety.

4. **Extract Card Component**: Create a dedicated card component for mobile views.

5. **Use URL Synchronization**: Enable URL synchronization for better user experience.

## Migration Guide

To migrate existing list components:

1. Create a feature-specific hook using `useBaseList`
2. Create a feature-specific card component for mobile views
3. Replace the existing list component with `BaseListComponent`
4. Update references to the list state (pagination, etc.)

See the `RefactoredCustomerList.tsx` example for a complete migration example.
