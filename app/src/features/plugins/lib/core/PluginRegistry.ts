import { Plugin } from '@/domain/entities/Plugin';
import { PluginInstallation } from '@/domain/entities/PluginInstallation';
import { IPluginContext, ILoadedPlugin } from './types';

export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, ILoadedPlugin> = new Map();
  private contexts: Map<string, IPluginContext> = new Map();

  private constructor() {}

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  register(
    plugin: Plugin,
    installation: PluginInstallation,
    loadedPlugin: ILoadedPlugin,
    context: IPluginContext
  ): void {
    const key = this.getKey(plugin.name, installation.installationId);
    this.plugins.set(key, loadedPlugin);
    this.contexts.set(key, context);
  }

  unregister(pluginName: string, installationId: string): void {
    const key = this.getKey(pluginName, installationId);
    
    // Cleanup plugin
    const loadedPlugin = this.plugins.get(key);
    if (loadedPlugin?.onDeactivate) {
      loadedPlugin.onDeactivate();
    }
    
    this.plugins.delete(key);
    this.contexts.delete(key);
  }

  get(pluginName: string, installationId: string): ILoadedPlugin | undefined {
    const key = this.getKey(pluginName, installationId);
    return this.plugins.get(key);
  }

  getContext(pluginName: string, installationId: string): IPluginContext | undefined {
    const key = this.getKey(pluginName, installationId);
    return this.contexts.get(key);
  }

  getByName(pluginName: string): ILoadedPlugin[] {
    const plugins: ILoadedPlugin[] = [];
    for (const [key, plugin] of this.plugins) {
      if (key.startsWith(`${pluginName}:`)) {
        plugins.push(plugin);
      }
    }
    return plugins;
  }

  getAll(): Map<string, ILoadedPlugin> {
    return new Map(this.plugins);
  }

  getAllByType(type: string): ILoadedPlugin[] {
    const plugins: ILoadedPlugin[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.metadata.type === type || plugin.metadata.type === 'mixed') {
        plugins.push(plugin);
      }
    }
    return plugins;
  }

  isRegistered(pluginName: string, installationId: string): boolean {
    const key = this.getKey(pluginName, installationId);
    return this.plugins.has(key);
  }

  clear(): void {
    // Cleanup all plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.onDeactivate) {
        plugin.onDeactivate();
      }
    }
    
    this.plugins.clear();
    this.contexts.clear();
  }

  private getKey(pluginName: string, installationId: string): string {
    return `${pluginName}:${installationId}`;
  }

  // Get plugins that provide specific routes
  getPluginsWithRoutes(): ILoadedPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.routes && Object.keys(p.routes).length > 0);
  }

  // Get plugins that provide UI components
  getPluginsWithComponents(): ILoadedPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.components);
  }

  // Get plugins that provide automation hooks
  getPluginsWithAutomation(): ILoadedPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.automationHooks);
  }

  // Execute a plugin route
  async executeRoute(
    pluginName: string,
    installationId: string,
    path: string,
    request: any
  ): Promise<any> {
    const plugin = this.get(pluginName, installationId);
    if (!plugin || !plugin.routes || !plugin.routes[path]) {
      throw new Error(`Route ${path} not found in plugin ${pluginName}`);
    }
    
    const context = this.getContext(pluginName, installationId);
    if (!context) {
      throw new Error(`Context not found for plugin ${pluginName}`);
    }
    
    // Execute in plugin context
    return plugin.routes[path](request);
  }

  // Get plugin statistics
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const stats = {
      total: this.plugins.size,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>
    };
    
    for (const plugin of this.plugins.values()) {
      // Count by type
      const type = plugin.metadata.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }
    
    return stats;
  }
}