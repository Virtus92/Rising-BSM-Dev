import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerList } from '../../components/CustomerList';
import { useCustomers } from '../../hooks/useCustomers';
import { useRouter } from 'next/navigation';
import { CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';

// Mock dependencies
jest.mock('../../hooks/useCustomers');
jest.mock('next/navigation');
jest.mock('@/shared/hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock the permission provider
jest.mock('@/features/permissions/providers/PermissionProvider', () => ({
  usePermissions: () => ({
    hasPermission: jest.fn().mockReturnValue(true),
    hasAnyPermission: jest.fn().mockReturnValue(true),
    hasAllPermissions: jest.fn().mockReturnValue(true),
    isLoading: false,
    isInitialized: true,
    permissions: ['customers.view', 'customers.edit', 'customers.delete'],
    checkPermission: jest.fn().mockResolvedValue(true),
    refetch: jest.fn(),
  }),
}));

describe('CustomerList', () => {
  const mockPush = jest.fn();
  const mockRefetch = jest.fn();
  
  const mockCustomers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      type: CustomerType.INDIVIDUAL,
      typeLabel: 'Individual',
      status: CommonStatus.ACTIVE,
      statusLabel: 'Active',
      company: null,
      city: 'New York',
      country: 'USA',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
      permissions: { canView: true, canEdit: true, canDelete: true },
    },
    {
      id: 2,
      name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '098-765-4321',
      type: CustomerType.BUSINESS,
      typeLabel: 'Business',
      status: CommonStatus.ACTIVE,
      statusLabel: 'Active',
      company: 'Acme Corporation',
      city: 'San Francisco',
      country: 'USA',
      createdAt: '2024-01-19T10:00:00Z',
      updatedAt: '2024-01-19T10:00:00Z',
      permissions: { canView: true, canEdit: true, canDelete: true },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useCustomers as jest.Mock).mockReturnValue({
      customers: mockCustomers,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
      refetch: mockRefetch,
      deleteCustomer: jest.fn(),
      searchCustomers: jest.fn(),
      filters: {
        type: undefined,
        status: undefined,
        search: undefined,
      },
      setFilters: jest.fn(),
      sortBy: 'createdAt',
      setSortBy: jest.fn(),
      sortOrder: 'desc',
      setSortOrder: jest.fn(),
    });
  });

  it('should render customer list with data', () => {
    render(<CustomerList />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useCustomers as jest.Mock).mockReturnValue({
      customers: [],
      isLoading: true,
      error: null,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      refetch: mockRefetch,
      filters: { type: undefined, status: undefined, search: undefined },
      setFilters: jest.fn(),
    });

    render(<CustomerList />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
    const errorMessage = 'Failed to load customers';
    (useCustomers as jest.Mock).mockReturnValue({
      customers: [],
      isLoading: false,
      error: errorMessage,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      refetch: mockRefetch,
      filters: { type: undefined, status: undefined, search: undefined },
      setFilters: jest.fn(),
    });

    render(<CustomerList />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should navigate to customer detail on row click', async () => {
    const user = userEvent.setup();
    
    render(<CustomerList />);
    
    const customerRow = screen.getByText('John Doe').closest('tr');
    await user.click(customerRow!);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard/customers/1');
  });

  it('should handle customer search', async () => {
    const user = userEvent.setup();
    const mockSearch = jest.fn();
    
    (useCustomers as jest.Mock).mockReturnValue({
      customers: mockCustomers,
      isLoading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      refetch: mockRefetch,
      searchCustomers: mockSearch,
      filters: { type: undefined, status: undefined, search: undefined },
      setFilters: jest.fn(),
    });

    render(<CustomerList />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'John');
    
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('John');
    });
  });

  it('should display customer type badges correctly', () => {
    render(<CustomerList />);
    
    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('should display customer status badges correctly', () => {
    render(<CustomerList />);
    
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges).toHaveLength(2);
  });

  it('should show empty state when no customers', () => {
    (useCustomers as jest.Mock).mockReturnValue({
      customers: [],
      isLoading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      refetch: mockRefetch,
      filters: { type: undefined, status: undefined, search: undefined },
      setFilters: jest.fn(),
    });

    render(<CustomerList />);
    
    expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    const user = userEvent.setup();
    const mockSetFilters = jest.fn();
    
    (useCustomers as jest.Mock).mockReturnValue({
      customers: mockCustomers,
      isLoading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
      refetch: mockRefetch,
      filters: { page: 1, type: undefined, status: undefined, search: undefined },
      setFilters: mockSetFilters,
    });

    render(<CustomerList />);
    
    // Find next page button
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    expect(mockSetFilters).toHaveBeenCalledWith(expect.objectContaining({
      page: 2
    }));
  });

  it('should handle sorting', async () => {
    const user = userEvent.setup();
    const mockSetSortBy = jest.fn();
    const mockSetSortOrder = jest.fn();
    
    (useCustomers as jest.Mock).mockReturnValue({
      customers: mockCustomers,
      isLoading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      refetch: mockRefetch,
      sortBy: 'name',
      setSortBy: mockSetSortBy,
      sortOrder: 'asc',
      setSortOrder: mockSetSortOrder,
      filters: { type: undefined, status: undefined, search: undefined },
      setFilters: jest.fn(),
    });

    render(<CustomerList />);
    
    // Click on name column header to sort
    const nameHeader = screen.getByText('Name').closest('th');
    await user.click(nameHeader!);
    
    expect(mockSetSortOrder).toHaveBeenCalledWith('desc');
  });
});