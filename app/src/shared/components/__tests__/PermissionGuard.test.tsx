import { render, screen } from '@testing-library/react';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { PermissionCategory, PermissionAction } from '@/domain/enums/PermissionEnums';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

// Mock the hooks
jest.mock('@/features/permissions/providers/PermissionProvider');
jest.mock('@/features/auth/providers/AuthProvider');

describe('PermissionGuard', () => {
  const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mock - non-admin user
    mockUseAuth.mockReturnValue({
      user: { id: 1, role: 'user', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshToken: jest.fn(),
    } as any);
  });

  describe('when user has permission', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        isLoading: false,
        isInitialized: true,
        permissions: ['users.view', 'users.edit'],
        checkPermission: jest.fn().mockResolvedValue(true),
        refetch: jest.fn(),
      } as any);
    });

    it('should render children when user has single permission', () => {
      render(
        <PermissionGuard
          permission={SystemPermission.USERS_VIEW}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render children when user has any of multiple permissions', () => {
      render(
        <PermissionGuard
          anyPermission={[SystemPermission.USERS_VIEW, SystemPermission.USERS_EDIT]}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('when user lacks permission', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        isLoading: false,
        isInitialized: true,
        permissions: [],
        checkPermission: jest.fn().mockResolvedValue(false),
        refetch: jest.fn(),
      } as any);
    });

    it('should render fallback when user lacks permission', () => {
      render(
        <PermissionGuard
          permission={SystemPermission.USERS_DELETE}
          fallback={<div>No Permission</div>}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('No Permission')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render nothing when no fallback provided', () => {
      const { container } = render(
        <PermissionGuard
          permission={SystemPermission.USERS_DELETE}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('when permissions are loading', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        isLoading: true,
        isInitialized: false,
        permissions: [],
        checkPermission: jest.fn().mockResolvedValue(false),
        refetch: jest.fn(),
      } as any);
    });

    it('should show loading state when showLoading is true', () => {
      render(
        <PermissionGuard
          permission={SystemPermission.USERS_VIEW}
          showLoading={true}
          loadingFallback={<div>Loading permissions...</div>}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Loading permissions...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('permission checks', () => {
    it('should check single permission correctly', () => {
      const hasPermissionMock = jest.fn().mockReturnValue(true);
      mockUsePermissions.mockReturnValue({
        hasPermission: hasPermissionMock,
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
        isLoading: false,
        isInitialized: true,
        permissions: ['customers.create'],
        checkPermission: jest.fn().mockResolvedValue(true),
        refetch: jest.fn(),
      } as any);

      render(
        <PermissionGuard
          permission={SystemPermission.CUSTOMERS_CREATE}
        >
          <div>Create Customer Button</div>
        </PermissionGuard>
      );

      expect(hasPermissionMock).toHaveBeenCalledWith(SystemPermission.CUSTOMERS_CREATE);
      expect(screen.getByText('Create Customer Button')).toBeInTheDocument();
    });
  });
});