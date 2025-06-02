/**
 * Plugin API Routes Documentation
 * 
 * This file documents all plugin-related API endpoints.
 */

/**
 * Plugin Management Endpoints
 * 
 * GET    /api/plugins                     - List all plugins
 * POST   /api/plugins                     - Create a new plugin
 * GET    /api/plugins/[id]                - Get plugin details
 * PUT    /api/plugins/[id]                - Update plugin
 * DELETE /api/plugins/[id]                - Delete plugin
 * 
 * POST   /api/plugins/[id]/submit-review  - Submit plugin for review
 * POST   /api/plugins/[id]/approve        - Approve plugin (admin)
 * POST   /api/plugins/[id]/reject         - Reject plugin (admin)
 * POST   /api/plugins/[id]/suspend        - Suspend plugin (admin)
 * 
 * GET    /api/plugins/[id]/versions       - Get plugin version history
 * POST   /api/plugins/[id]/bundle         - Upload plugin bundle
 * GET    /api/plugins/[id]/bundle         - Download plugin bundle
 */

/**
 * License Management Endpoints
 * 
 * GET    /api/plugins/licenses            - Get user's licenses
 * POST   /api/plugins/licenses            - Generate new license
 * POST   /api/plugins/licenses/verify     - Verify license key
 */

/**
 * Installation Management Endpoints
 * 
 * GET    /api/plugins/installations                           - List user installations
 * POST   /api/plugins/installations                           - Install plugin
 * GET    /api/plugins/installations/[id]                      - Get installation details
 * PATCH  /api/plugins/installations/[id]                      - Activate/deactivate
 * DELETE /api/plugins/installations/[id]                      - Uninstall plugin
 * POST   /api/plugins/installations/[id]/heartbeat            - Update heartbeat
 */

export const PLUGIN_API_ROUTES = {
  // Plugin management
  LIST_PLUGINS: '/api/plugins',
  CREATE_PLUGIN: '/api/plugins',
  GET_PLUGIN: '/api/plugins/:id',
  UPDATE_PLUGIN: '/api/plugins/:id',
  DELETE_PLUGIN: '/api/plugins/:id',
  
  // Plugin lifecycle
  SUBMIT_REVIEW: '/api/plugins/:id/submit-review',
  APPROVE_PLUGIN: '/api/plugins/:id/approve',
  REJECT_PLUGIN: '/api/plugins/:id/reject',
  SUSPEND_PLUGIN: '/api/plugins/:id/suspend',
  
  // Plugin distribution
  GET_VERSIONS: '/api/plugins/:id/versions',
  UPLOAD_BUNDLE: '/api/plugins/:id/bundle',
  DOWNLOAD_BUNDLE: '/api/plugins/:id/bundle',
  
  // License management
  LIST_LICENSES: '/api/plugins/licenses',
  CREATE_LICENSE: '/api/plugins/licenses',
  VERIFY_LICENSE: '/api/plugins/licenses/verify',
  
  // Installation management
  LIST_INSTALLATIONS: '/api/plugins/installations',
  INSTALL_PLUGIN: '/api/plugins/installations',
  GET_INSTALLATION: '/api/plugins/installations/:id',
  UPDATE_INSTALLATION: '/api/plugins/installations/:id',
  UNINSTALL_PLUGIN: '/api/plugins/installations/:id',
  UPDATE_HEARTBEAT: '/api/plugins/installations/:id/heartbeat'
};