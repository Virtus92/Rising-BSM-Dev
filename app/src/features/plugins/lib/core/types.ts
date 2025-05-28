// Plugin metadata and configuration types
export interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
  type: 'ui' | 'api' | 'automation' | 'mixed';
  permissions?: {
    required: string[];
    granted?: string[];
    apiAccess?: {
      internal: string[];
      external: boolean;
    };
  };
}

// Plugin context provided to plugins
export interface IPluginContext {
  plugin: {
    id: number;
    name: string;
    version: string;
    type: string;
  };
  license: {
    type: string;
    expiresAt?: Date;
    limits: Record<string, any>;
  };
  api: ISecureAPIClient;
  storage: ISecureStorage;
  events: ISecureEventBus;
  logger: ISecureLogger;
  resources: IResourceTracker;
}

// Secure API client for plugins
export interface ISecureAPIClient {
  fetch(endpoint: string, options?: RequestInit): Promise<Response>;
}

// Secure storage for plugins
export interface ISecureStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
}

// Secure event bus for plugins
export interface ISecureEventBus {
  emit(event: string, data: any): void;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}

// Secure logger for plugins
export interface ISecureLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// Resource tracker for monitoring plugin usage
export interface IResourceTracker {
  trackApiCall(): void;
  trackMemory(bytes: number): void;
  getUsage(): { apiCalls: number; memoryUsage: number };
  reset(): void;
}

// Plugin request/response types
export interface PluginRequest {
  method: string;
  path: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  user?: {
    id: number;
    email: string;
    permissions: string[];
  };
}

export interface PluginResponse {
  status: number;
  body?: any;
  headers?: Record<string, string>;
}

// Plugin route handler
export type PluginRouteHandler = (req: PluginRequest) => Promise<PluginResponse>;

// Plugin UI component
export interface PluginComponent {
  render(): any; // Would return React component in actual implementation
  props?: Record<string, any>;
}

// Plugin automation hook
export interface AutomationHook {
  onEntityCreate?: (entity: string, data: any) => Promise<void>;
  onEntityUpdate?: (entity: string, data: any) => Promise<void>;
  onEntityDelete?: (entity: string, id: number) => Promise<void>;
  onCustomEvent?: (event: string, data: any) => Promise<void>;
}

// Main plugin interface
export interface ILoadedPlugin {
  metadata: PluginMetadata;
  
  // Lifecycle hooks
  onInstall?: (context: IPluginContext) => Promise<void>;
  onActivate?: (context: IPluginContext) => Promise<void>;
  onDeactivate?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onLicenseVerified?: (license: any) => Promise<void>;
  
  // Functionality
  routes?: Record<string, PluginRouteHandler>;
  components?: {
    dashboard?: () => PluginComponent;
    settings?: () => PluginComponent;
    pages?: Record<string, () => PluginComponent>;
  };
  automationHooks?: AutomationHook;
  services?: Record<string, any>;
}

// Plugin bundle format
export interface PluginBundle {
  metadata: PluginMetadata;
  code: string;
  assets?: Record<string, string>; // filename -> base64 content
  dependencies?: Record<string, string>; // package -> version
  checksum: string;
  signature: string;
}

// Plugin execution result
export interface PluginExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  resourceUsage: {
    apiCalls: number;
    memoryUsage: number;
    cpuTime?: number;
  };
}