import { VM } from 'vm2';
import { Plugin } from '@/domain/entities/Plugin';
import { PluginInstallation } from '@/domain/entities/PluginInstallation';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import { PluginRegistry } from './PluginRegistry';
import { PluginSandbox } from './PluginSandbox';
import { IPluginContext, ILoadedPlugin, PluginMetadata } from './types';
import { getLogger } from '@/core/logging';
import type { ILoggingService } from '@/core/logging';

export class PluginLoader {
  private registry: PluginRegistry;
  private encryptionService: PluginEncryptionService;
  private logger: ILoggingService;

  constructor(
    encryptionService: PluginEncryptionService,
    logger?: ILoggingService
  ) {
    this.registry = PluginRegistry.getInstance();
    this.encryptionService = encryptionService;
    this.logger = logger || getLogger();
  }

  async loadPlugin(
    plugin: Plugin,
    installation: PluginInstallation,
    encryptedBundle: Buffer,
    licenseKey: string
  ): Promise<void> {
    try {
      // 1. Check if already loaded
      if (this.registry.isRegistered(plugin.name, installation.installationId)) {
        this.logger.warn(`Plugin ${plugin.name} already loaded for installation ${installation.installationId}`);
        return;
      }

      // 2. Decrypt plugin bundle
      const decryptedCode = await this.encryptionService.decryptPlugin(
        {
          data: encryptedBundle,
          iv: Buffer.from(installation.encryptionKey.split(':')[0], 'hex'),
          checksum: installation.encryptionKey.split(':')[1],
          algorithm: 'aes-256-gcm',
          version: 1
        },
        licenseKey
      );

      // 3. Verify plugin signature
      const codeString = decryptedCode.toString();
      const isValidSignature = await this.encryptionService.verifyPluginSignature(
        decryptedCode,
        plugin.certificate,
        plugin.publicKey
      );

      if (!isValidSignature) {
        throw new Error('Invalid plugin signature');
      }

      // 4. Create plugin context
      const context = this.createPluginContext(plugin, installation);

      // 5. Create and configure sandbox
      const sandbox = new PluginSandbox(plugin, installation);
      const sandboxedContext = await sandbox.createSandbox(context);

      // 6. Load plugin in sandbox
      const loadedPlugin = await this.executeInSandbox(codeString, sandboxedContext);

      // 7. Validate plugin structure
      this.validatePlugin(loadedPlugin);

      // 8. Initialize plugin
      if (loadedPlugin.onInstall && !installation.lastActivated) {
        await loadedPlugin.onInstall(context);
      }

      if (loadedPlugin.onActivate) {
        await loadedPlugin.onActivate(context);
      }

      // 9. Register plugin
      this.registry.register(plugin, installation, loadedPlugin, context);

      this.logger.info(`Plugin ${plugin.name} loaded successfully for installation ${installation.installationId}`);
    } catch (error) {
      this.logger.error(`Failed to load plugin ${plugin.name}`, error as Error);
      throw error;
    }
  }

  async unloadPlugin(pluginName: string, installationId: string): Promise<void> {
    try {
      const loadedPlugin = this.registry.get(pluginName, installationId);
      
      if (!loadedPlugin) {
        this.logger.warn(`Plugin ${pluginName} not found for installation ${installationId}`);
        return;
      }

      // Call deactivation hook
      if (loadedPlugin.onDeactivate) {
        await loadedPlugin.onDeactivate();
      }

      // Unregister from registry
      this.registry.unregister(pluginName, installationId);

      this.logger.info(`Plugin ${pluginName} unloaded for installation ${installationId}`);
    } catch (error) {
      this.logger.error(`Failed to unload plugin ${pluginName}`, error as Error);
      throw error;
    }
  }

  private createPluginContext(
    plugin: Plugin,
    installation: PluginInstallation
  ): IPluginContext {
    return {
      plugin: {
        id: plugin.id!,
        name: plugin.name,
        version: plugin.version,
        type: plugin.type
      },
      license: {
        type: 'basic', // This would come from the actual license
        expiresAt: undefined,
        limits: {}
      },
      api: this.createSecureAPIClient(plugin, installation),
      storage: this.createSecureStorage(plugin, installation),
      events: this.createSecureEventBus(plugin, installation),
      logger: this.createSecureLogger(plugin, installation),
      resources: this.createResourceTracker(plugin, installation)
    };
  }

  private async executeInSandbox(
    code: string,
    context: any
  ): Promise<ILoadedPlugin> {
    const vm = new VM({
      timeout: 5000, // 5 seconds to load
      sandbox: context,
      fixAsync: true,
      eval: false,
      wasm: false
    });

    // Wrap code to export the plugin
    const wrappedCode = `
      (function() {
        ${code}
        
        // The plugin should define a global 'RisingBSMPlugin'
        if (typeof RisingBSMPlugin === 'undefined') {
          throw new Error('Plugin must export RisingBSMPlugin');
        }
        
        return RisingBSMPlugin;
      })()
    `;

    return vm.run(wrappedCode);
  }

  private validatePlugin(plugin: any): void {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin must be an object');
    }

    if (!plugin.metadata || typeof plugin.metadata !== 'object') {
      throw new Error('Plugin must have metadata');
    }

    const requiredMetadata = ['name', 'version', 'author', 'description'];
    for (const field of requiredMetadata) {
      if (!plugin.metadata[field]) {
        throw new Error(`Plugin metadata must include ${field}`);
      }
    }

    // Validate permissions if specified
    if (plugin.metadata.permissions) {
      if (!plugin.metadata.permissions.required || !Array.isArray(plugin.metadata.permissions.required)) {
        throw new Error('Plugin permissions.required must be an array');
      }
    }
  }

  private createSecureAPIClient(plugin: Plugin, installation: PluginInstallation) {
    return {
      fetch: async (endpoint: string, options?: any) => {
        // Validate endpoint access
        const permissions = plugin.permissions || [];
        const hasAccess = permissions.some(p => 
          p.code === `api.${endpoint}` || p.code === 'api.*'
        );
        
        if (!hasAccess) {
          throw new Error(`Plugin does not have permission to access ${endpoint}`);
        }

        // Add plugin headers
        const headers = {
          ...options?.headers,
          'X-Plugin-Name': plugin.name,
          'X-Plugin-Installation': installation.installationId
        };

        // Make request (implementation would use actual API client)
        return fetch(`/api/${endpoint}`, { ...options, headers });
      }
    };
  }

  private createSecureStorage(plugin: Plugin, installation: PluginInstallation) {
    const storageKey = `plugin:${plugin.name}:${installation.installationId}`;
    
    return {
      get: async (key: string) => {
        const fullKey = `${storageKey}:${key}`;
        // Implementation would use actual storage service
        return localStorage.getItem(fullKey);
      },
      set: async (key: string, value: any) => {
        const fullKey = `${storageKey}:${key}`;
        localStorage.setItem(fullKey, JSON.stringify(value));
      },
      delete: async (key: string) => {
        const fullKey = `${storageKey}:${key}`;
        localStorage.removeItem(fullKey);
      }
    };
  }

  private createSecureEventBus(plugin: Plugin, installation: PluginInstallation) {
    const eventPrefix = `plugin:${plugin.name}`;
    
    return {
      emit: (event: string, data: any) => {
        const fullEvent = `${eventPrefix}:${event}`;
        // Implementation would use actual event system
        window.dispatchEvent(new CustomEvent(fullEvent, { detail: data }));
      },
      on: (event: string, handler: Function) => {
        const fullEvent = `${eventPrefix}:${event}`;
        window.addEventListener(fullEvent, handler as any);
      },
      off: (event: string, handler: Function) => {
        const fullEvent = `${eventPrefix}:${event}`;
        window.removeEventListener(fullEvent, handler as any);
      }
    };
  }

  private createSecureLogger(plugin: Plugin, installation: PluginInstallation) {
    const prefix = `[Plugin:${plugin.name}]`;
    
    return {
      debug: (message: string, ...args: any[]) => {
        this.logger.debug(`${prefix} ${message}`, ...args);
      },
      info: (message: string, ...args: any[]) => {
        this.logger.info(`${prefix} ${message}`, ...args);
      },
      warn: (message: string, ...args: any[]) => {
        this.logger.warn(`${prefix} ${message}`, ...args);
      },
      error: (message: string, ...args: any[]) => {
        this.logger.error(`${prefix} ${message}`, ...args);
      }
    };
  }

  private createResourceTracker(plugin: Plugin, installation: PluginInstallation) {
    let apiCalls = 0;
    let memoryUsage = 0;
    
    return {
      trackApiCall: () => {
        apiCalls++;
      },
      trackMemory: (bytes: number) => {
        memoryUsage += bytes;
      },
      getUsage: () => ({
        apiCalls,
        memoryUsage
      }),
      reset: () => {
        apiCalls = 0;
        memoryUsage = 0;
      }
    };
  }

  getLoadedPlugin(pluginName: string, installationId: string): ILoadedPlugin | null {
    return this.registry.get(pluginName, installationId) || null;
  }

  getAllLoadedPlugins(): Map<string, ILoadedPlugin> {
    return this.registry.getAll();
  }
}

// Export LoadedPlugin type alias for backward compatibility
export type LoadedPlugin = ILoadedPlugin;