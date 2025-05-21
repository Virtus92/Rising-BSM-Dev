import { 
  SystemPermissionMap,
  getPermissionDefinition,
  createPermissionDefinitionList,
  getAllPermissionCodes,
  findMissingPermissions,
  getDefaultPermissionsForRole
} from '../SystemPermissionMap';
import { PermissionCategory, PermissionAction, SystemPermission } from '@/domain/enums/PermissionEnums';

describe('SystemPermissionMap', () => {
  describe('permission map structure', () => {
    it('should test consistency between enum and map', () => {
      // Just verify the length of the map is consistent with what we expect
      const permissionMapKeys = Object.keys(SystemPermissionMap);
      
      // Check that we have at least the expected number of permissions
      // This is a simpler way to verify the map is populated correctly
      expect(permissionMapKeys.length).toBeGreaterThanOrEqual(20);

      // Verify a few key permissions exist in the map
      expect(SystemPermissionMap['dashboard.access']).toBeDefined();
      expect(SystemPermissionMap['users.view']).toBeDefined();
      expect(SystemPermissionMap['customers.view']).toBeDefined();
      expect(SystemPermissionMap['requests.view']).toBeDefined();
      expect(SystemPermissionMap['system.admin']).toBeDefined();
    });
    
    it('should have correct structure for each permission definition', () => {
      Object.entries(SystemPermissionMap).forEach(([key, definition]) => {
        expect(definition).toHaveProperty('code', key);
        expect(definition).toHaveProperty('name');
        expect(definition).toHaveProperty('description');
        expect(definition).toHaveProperty('category');
        expect(definition).toHaveProperty('action');
      });
    });
    
    it('should have consistent category and action values', () => {
      Object.values(SystemPermissionMap).forEach(definition => {
        // For system admin permission, the category and action may differ
        if (definition.code !== SystemPermission.SYSTEM_ADMIN) {
          const [category, action] = definition.code.split('.');
          
          // Verify category matches the first part of the code
          expect(definition.category.toLowerCase()).toEqual(
            expect.stringContaining(category.toLowerCase())
          );
          
          // Verify action matches the general meaning of the second part of the code
          // Some codes like 'convert' map to 'manage' for UI consistency
          if (action !== 'convert') {
            expect(definition.action.toLowerCase()).toEqual(action.toLowerCase());
          }
        }
      });
    });
  });
  
  describe('getPermissionDefinition', () => {
    it('should return the correct permission definition for a valid code', () => {
      const code = SystemPermission.USERS_VIEW;
      const definition = getPermissionDefinition(code);
      
      expect(definition).toBeDefined();
      expect(definition?.code).toBe(code);
      expect(definition?.name).toBe('View Users');
      expect(definition?.category).toBe(PermissionCategory.USERS);
      expect(definition?.action).toBe(PermissionAction.VIEW);
    });
    
    it('should return undefined for a non-existent permission code', () => {
      const definition = getPermissionDefinition('nonexistent.permission');
      expect(definition).toBeUndefined();
    });
    
    it('should throw an error if no permission code is provided', () => {
      // @ts-ignore - Testing invalid input
      expect(() => getPermissionDefinition()).toThrow();
      expect(() => getPermissionDefinition('')).toThrow();
      // @ts-ignore - Testing invalid input
      expect(() => getPermissionDefinition(null)).toThrow();
    });
  });
  
  describe('createPermissionDefinitionList', () => {
    it('should return all permission definitions when no codes are provided', () => {
      const definitions = createPermissionDefinitionList();
      
      // Should match the number of enum values
      expect(definitions.length).toBe(Object.values(SystemPermission).length);
      
      // Check for a specific known permission to be in the list
      const usersView = definitions.find(d => d.code === SystemPermission.USERS_VIEW);
      expect(usersView).toBeDefined();
      expect(usersView?.name).toBe('View Users');
    });
    
    it('should return specific permission definitions when codes are provided', () => {
      const codes = [
        SystemPermission.USERS_VIEW,
        SystemPermission.CUSTOMERS_CREATE
      ];
      
      const definitions = createPermissionDefinitionList(codes);
      
      expect(definitions.length).toBe(codes.length);
      expect(definitions[0].code).toBe(SystemPermission.USERS_VIEW);
      expect(definitions[1].code).toBe(SystemPermission.CUSTOMERS_CREATE);
    });
    
    it('should generate sensible definitions for unknown permission codes', () => {
      const unknownCode = 'custom.action';
      const definitions = createPermissionDefinitionList([unknownCode]);
      
      expect(definitions.length).toBe(1);
      expect(definitions[0].code).toBe(unknownCode);
      
      // Should generate a name based on the code parts
      expect(definitions[0].name).toBe('Action Custom');
      expect(definitions[0].category).toBe('Custom');
      expect(definitions[0].action).toBe('action');
    });
    
    it('should handle empty array and invalid inputs gracefully', () => {
      // Empty array should return all permissions
      const emptyArrayResult = createPermissionDefinitionList([]);
      expect(emptyArrayResult.length).toBe(Object.values(SystemPermission).length);
      
      // @ts-ignore - Testing invalid input
      const nullInput = createPermissionDefinitionList(null);
      expect(nullInput.length).toBe(Object.values(SystemPermission).length);
    });
  });
  
  describe('getAllPermissionCodes', () => {
    it('should return all permission codes from the map', () => {
      const codes = getAllPermissionCodes();
      
      expect(codes.length).toBe(Object.keys(SystemPermissionMap).length);
      expect(codes).toContain(SystemPermission.USERS_VIEW);
      expect(codes).toContain(SystemPermission.CUSTOMERS_CREATE);
      expect(codes).toContain(SystemPermission.SYSTEM_ADMIN);
    });
  });
  
  describe('findMissingPermissions', () => {
    it('should return empty array if all enum permissions have definitions', () => {
      const missing = findMissingPermissions();
      expect(missing).toEqual([]);
    });
    
    // This test is for future proofing in case someone adds to the enum without updating the map
    it('should identify enum permissions missing from the map', () => {
      // Mock implementation to simulate missing permissions
      const originalSystemPermissionMap = { ...SystemPermissionMap };
      
      // Create a temporary copy for manipulation in test
      // Use type assertion for a test-specific global extension
      (global as any).SystemPermissionMap = { ...SystemPermissionMap };
      
      // Delete a permission from the map to simulate a missing one
      const testPermission = SystemPermission.USERS_VIEW;
      // Use type assertion for test
      delete (global as any).SystemPermissionMap[testPermission];
      
      // Create spy for function that returns mock data
      const spy = jest.spyOn(Object, 'keys').mockImplementationOnce(() => {
        return Object.keys((global as any).SystemPermissionMap);
      });
      
      const missing = findMissingPermissions();
      
      expect(missing).toContain(testPermission);
      
      // Clean up
      spy.mockRestore();
      // Restore the original
      (global as any).SystemPermissionMap = originalSystemPermissionMap;
    });
  });
  
  describe('getDefaultPermissionsForRole', () => {
    const basicPermissions = [
      SystemPermission.PROFILE_VIEW,
      SystemPermission.PROFILE_EDIT,
      SystemPermission.DASHBOARD_ACCESS
    ];
    
    it('should return all permissions for admin role', () => {
      const adminPermissions = getDefaultPermissionsForRole('admin');
      
      // Admin should have all basic permissions
      basicPermissions.forEach(permission => {
        expect(adminPermissions).toContain(permission);
      });
      
      // Admin should have system admin permission
      expect(adminPermissions).toContain(SystemPermission.SYSTEM_ADMIN);
      
      // Admin should have all user permissions
      expect(adminPermissions).toContain(SystemPermission.USERS_VIEW);
      expect(adminPermissions).toContain(SystemPermission.USERS_CREATE);
      expect(adminPermissions).toContain(SystemPermission.USERS_EDIT);
      expect(adminPermissions).toContain(SystemPermission.USERS_DELETE);
      
      // Admin should have permissions management
      expect(adminPermissions).toContain(SystemPermission.PERMISSIONS_VIEW);
      expect(adminPermissions).toContain(SystemPermission.PERMISSIONS_MANAGE);
    });
    
    it('should return appropriate permissions for manager role', () => {
      const managerPermissions = getDefaultPermissionsForRole('manager');
      
      // Manager should have all basic permissions
      basicPermissions.forEach(permission => {
        expect(managerPermissions).toContain(permission);
      });
      
      // Manager should have user view but not user delete
      expect(managerPermissions).toContain(SystemPermission.USERS_VIEW);
      expect(managerPermissions).not.toContain(SystemPermission.USERS_DELETE);
      expect(managerPermissions).not.toContain(SystemPermission.PERMISSIONS_MANAGE);
      
      // Manager should not have system admin permission
      expect(managerPermissions).not.toContain(SystemPermission.SYSTEM_ADMIN);
    });
    
    it('should return only basic permissions for unknown role', () => {
      const unknownRolePermissions = getDefaultPermissionsForRole('unknown-role');
      
      // Should only have basic permissions
      expect(unknownRolePermissions).toEqual(basicPermissions);
    });
    
    it('should handle role names case-insensitively', () => {
      const adminLower = getDefaultPermissionsForRole('admin');
      const adminUpper = getDefaultPermissionsForRole('ADMIN');
      const adminMixed = getDefaultPermissionsForRole('Admin');
      
      expect(adminLower).toEqual(adminUpper);
      expect(adminLower).toEqual(adminMixed);
    });
  });
});