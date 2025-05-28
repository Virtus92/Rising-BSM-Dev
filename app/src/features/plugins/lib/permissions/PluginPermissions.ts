import { PermissionDefinition } from '@/domain/permissions/SystemPermissionMap';

export const PluginPermissions: PermissionDefinition[] = [
  // Plugin Management
  {
    code: 'plugin.view',
    name: 'View Plugins',
    description: 'Can view plugin list and details',
    category: 'Plugins',
    action: 'view'
  },
  {
    code: 'plugin.create',
    name: 'Create Plugins',
    description: 'Can create and submit new plugins',
    category: 'Plugins',
    action: 'create'
  },
  {
    code: 'plugin.update',
    name: 'Update Plugins',
    description: 'Can update plugin details and upload bundles',
    category: 'Plugins',
    action: 'update'
  },
  {
    code: 'plugin.delete',
    name: 'Delete Plugins',
    description: 'Can delete plugins (admin only)',
    category: 'Plugins',
    action: 'delete'
  },
  {
    code: 'plugin.approve',
    name: 'Approve Plugins',
    description: 'Can approve or reject plugin submissions (admin only)',
    category: 'Plugins',
    action: 'approve'
  },

  // License Management
  {
    code: 'plugin.license.view',
    name: 'View Plugin Licenses',
    description: 'Can view own plugin licenses',
    category: 'Plugins',
    action: 'view'
  },
  {
    code: 'plugin.license.create',
    name: 'Create Plugin Licenses',
    description: 'Can generate new plugin licenses',
    category: 'Plugins',
    action: 'create'
  },
  {
    code: 'plugin.license.update',
    name: 'Update Plugin Licenses',
    description: 'Can update license details (renew, upgrade)',
    category: 'Plugins',
    action: 'update'
  },
  {
    code: 'plugin.license.revoke',
    name: 'Revoke Plugin Licenses',
    description: 'Can revoke or suspend licenses (admin only)',
    category: 'Plugins',
    action: 'revoke'
  },

  // Installation Management
  {
    code: 'plugin.install.view',
    name: 'View Plugin Installations',
    description: 'Can view own plugin installations',
    category: 'Plugins',
    action: 'view'
  },
  {
    code: 'plugin.install.create',
    name: 'Install Plugins',
    description: 'Can install plugins with valid license',
    category: 'Plugins',
    action: 'create'
  },
  {
    code: 'plugin.install.update',
    name: 'Update Plugin Installations',
    description: 'Can activate/deactivate plugin installations',
    category: 'Plugins',
    action: 'update'
  },
  {
    code: 'plugin.install.delete',
    name: 'Uninstall Plugins',
    description: 'Can uninstall plugins',
    category: 'Plugins',
    action: 'delete'
  },

  // Marketplace
  {
    code: 'plugin.marketplace.access',
    name: 'Access Plugin Marketplace',
    description: 'Can access and browse the plugin marketplace',
    category: 'Plugins',
    action: 'access'
  },
  {
    code: 'plugin.marketplace.purchase',
    name: 'Purchase Plugins',
    description: 'Can purchase plugins from marketplace',
    category: 'Plugins',
    action: 'purchase'
  },

  // Development
  {
    code: 'plugin.develop',
    name: 'Develop Plugins',
    description: 'Can access plugin development tools and SDK',
    category: 'Plugins',
    action: 'develop'
  }
];

// Role mappings for plugin permissions
export const PluginRolePermissions = {
  admin: [
    'plugin.view',
    'plugin.create',
    'plugin.update',
    'plugin.delete',
    'plugin.approve',
    'plugin.license.view',
    'plugin.license.create',
    'plugin.license.update',
    'plugin.license.revoke',
    'plugin.install.view',
    'plugin.install.create',
    'plugin.install.update',
    'plugin.install.delete',
    'plugin.marketplace.access',
    'plugin.marketplace.purchase',
    'plugin.develop'
  ],
  developer: [
    'plugin.view',
    'plugin.create',
    'plugin.update',
    'plugin.license.view',
    'plugin.install.view',
    'plugin.install.create',
    'plugin.install.update',
    'plugin.install.delete',
    'plugin.marketplace.access',
    'plugin.marketplace.purchase',
    'plugin.develop'
  ],
  user: [
    'plugin.view',
    'plugin.license.view',
    'plugin.install.view',
    'plugin.install.create',
    'plugin.install.update',
    'plugin.install.delete',
    'plugin.marketplace.access',
    'plugin.marketplace.purchase'
  ]
};