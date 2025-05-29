# Rising-BSM Plugin System - Production Implementation Plan

## Executive Summary

This document provides a pragmatic, production-ready implementation plan for the Rising-BSM plugin system. Based on thorough analysis of the existing codebase, architecture documents, and industry best practices, this plan addresses the gap between the current metadata-only system and a fully functional plugin platform.

## Current State Assessment

### What Works Well
- **Architecture**: Well-designed domain models, DTOs, and interfaces
- **Security Services**: Comprehensive encryption and license verification (unused but well-implemented)
- **Database Schema**: Complete and well-structured
- **Service Pattern**: Follows established codebase patterns

### Critical Gaps
- **No Real Sandboxing**: Current SafeVM uses unsafe `new Function()`
- **Empty Implementations**: Repositories and UI components are shells
- **No Plugin Loading**: No mechanism to actually load and execute plugins
- **Missing Dev Tools**: No SDK, CLI, or documentation for developers

## Implementation Strategy

### Core Principle: Progressive Enhancement
Instead of trying to build everything at once, we'll implement in phases, ensuring each phase delivers value and maintains backward compatibility.

## Phase 1: Foundation & Security (Weeks 1-3)

### 1.1 Implement Secure Sandboxing

**Replace the unsafe SafeVM with a production-ready solution:**

```typescript
// Option 1: isolated-vm (Recommended for V8 isolation)
import Isolated from 'isolated-vm';

class SecurePluginSandbox {
  private isolate: Isolated.Isolate;
  
  constructor() {
    this.isolate = new Isolated.Isolate({ 
      memoryLimit: 128,  // MB
      inspector: false    // Disable debugging in production
    });
  }
  
  async executePlugin(code: string, context: PluginContext): Promise<any> {
    const isolateContext = await this.isolate.createContext();
    
    // Inject secure APIs
    await isolateContext.global.set('rising', new Isolated.Reference(context.api));
    
    // Compile and run with timeout
    const script = await this.isolate.compileScript(code);
    return await script.run(isolateContext, { 
      timeout: 30000,
      release: true 
    });
  }
}

// Option 2: Worker Threads (Node.js native)
import { Worker } from 'worker_threads';

class WorkerPluginSandbox {
  async executePlugin(code: string, context: PluginContext): Promise<any> {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./plugin-worker.js', {
        workerData: { code, context },
        resourceLimits: {
          maxOldGenerationSizeMb: 128,
          maxYoungGenerationSizeMb: 32
        }
      });
      
      worker.on('message', resolve);
      worker.on('error', reject);
      
      // Enforce timeout
      setTimeout(() => {
        worker.terminate();
        reject(new Error('Plugin execution timeout'));
      }, 30000);
    });
  }
}
```

### 1.2 Implement Repository Layer

Following the established PrismaRepository pattern:

```typescript
// src/features/plugins/lib/repositories/PluginRepository.ts
import { PrismaRepository } from '@/core/repositories';
import { Plugin, IPluginRepository } from '@/domain';
import { Prisma } from '@prisma/client';

export class PluginRepository extends PrismaRepository implements IPluginRepository {
  async findByName(name: string): Promise<Plugin | null> {
    const record = await this.prisma.plugin.findUnique({
      where: { name },
      include: {
        author: true,
        licenses: true,
        installations: true
      }
    });
    
    return record ? this.mapToEntity(record) : null;
  }
  
  async findApproved(options?: { limit?: number; offset?: number }): Promise<Plugin[]> {
    const records = await this.prisma.plugin.findMany({
      where: { status: 'approved' },
      include: { author: true },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { downloads: 'desc' }
    });
    
    return records.map(this.mapToEntity);
  }
  
  async incrementDownloads(id: number): Promise<void> {
    await this.prisma.plugin.update({
      where: { id },
      data: { downloads: { increment: 1 } }
    });
  }
  
  private mapToEntity(record: any): Plugin {
    return new Plugin({
      id: record.id,
      uuid: record.uuid,
      name: record.name,
      displayName: record.displayName,
      description: record.description,
      version: record.version,
      author: record.author?.name || record.author,
      status: record.status,
      type: record.type,
      category: record.category,
      tags: record.tags,
      icon: record.icon,
      screenshots: record.screenshots,
      certificate: record.certificate,
      publicKey: record.publicKey,
      checksum: record.checksum,
      pricing: record.pricing,
      trialDays: record.trialDays,
      permissions: record.permissions,
      dependencies: record.dependencies,
      minAppVersion: record.minAppVersion,
      maxAppVersion: record.maxAppVersion,
      downloads: record.downloads,
      rating: record.rating,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }
}
```

### 1.3 Complete Service Integration

Ensure services properly use repositories and follow patterns:

```typescript
// src/features/plugins/lib/services/PluginService.ts
import 'server-only';
import { 
  IPluginService, 
  IPluginRepository,
  IPluginLicenseRepository,
  ILoggingService,
  IValidationService,
  IActivityLogService,
  PluginDto,
  ValidationResultDto
} from '@/domain';
import { ServiceError } from '@/core/errors';
import { PluginEncryptionService } from '../security';

export class PluginService implements IPluginService {
  constructor(
    private repository: IPluginRepository,
    private licenseRepository: IPluginLicenseRepository,
    private logger: ILoggingService,
    private validator: IValidationService,
    private activityLog: IActivityLogService,
    private encryption: PluginEncryptionService
  ) {}
  
  async create(data: PluginDto, authorId: number): Promise<PluginDto> {
    try {
      // Validate
      const validation = await this.validate(data);
      if (!validation.isValid) {
        throw new ServiceError('Validation failed', 400, validation.errors);
      }
      
      // Generate security keys
      const { publicKey, privateKey } = await this.encryption.generateKeyPair();
      
      // Create plugin
      const plugin = await this.repository.create({
        ...data,
        authorId,
        publicKey,
        status: 'pending'
      });
      
      // Log activity
      await this.activityLog.log({
        userId: authorId,
        action: 'plugin.created',
        entityType: 'Plugin',
        entityId: plugin.id,
        metadata: { pluginName: plugin.name }
      });
      
      // Store private key securely (in production, use KMS)
      await this.storePrivateKey(plugin.id, privateKey);
      
      return this.toDto(plugin);
    } catch (error) {
      this.logger.error('Failed to create plugin', { error, data });
      throw error;
    }
  }
  
  // ... other methods following the same pattern
}
```

## Phase 2: Plugin Runtime & Loading (Weeks 4-6)

### 2.1 Plugin Bundle Format

Define a standard plugin bundle structure:

```typescript
// Plugin bundle structure (.rbsm file - essentially a ZIP)
interface PluginBundle {
  manifest: {
    name: string;
    version: string;
    type: 'ui' | 'api' | 'automation' | 'mixed';
    main: string;           // Entry point
    permissions: string[];  // Required permissions
    dependencies: Record<string, string>;
    exports?: {
      components?: string[];  // UI components to export
      routes?: string[];      // API routes to export
      hooks?: string[];       // Automation hooks
    };
  };
  files: {
    'index.js': string;     // Main entry point
    'components/': {...},   // UI components
    'api/': {...},         // API handlers
    'styles/': {...}       // CSS/styles
  };
  signature: string;       // Digital signature
  metadata: {
    buildTime: string;
    builderVersion: string;
  };
}
```

### 2.2 Plugin Loader Implementation

```typescript
// src/features/plugins/lib/core/PluginLoader.ts
import { SecurePluginSandbox } from './SecurePluginSandbox';
import { PluginAPIBridge } from './PluginAPIBridge';
import { PluginBundle, LoadedPlugin } from './types';

export class PluginLoader {
  private sandbox: SecurePluginSandbox;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  
  constructor(
    private encryption: PluginEncryptionService,
    private apiBridge: PluginAPIBridge
  ) {
    this.sandbox = new SecurePluginSandbox();
  }
  
  async loadPlugin(
    bundle: PluginBundle, 
    license: PluginLicense
  ): Promise<LoadedPlugin> {
    // 1. Verify signature
    const isValid = await this.encryption.verifySignature(
      bundle,
      bundle.signature
    );
    if (!isValid) {
      throw new Error('Invalid plugin signature');
    }
    
    // 2. Decrypt code if encrypted
    const code = await this.encryption.decryptPlugin(
      bundle.files['index.js'],
      license.licenseKey
    );
    
    // 3. Create plugin context
    const context = this.createPluginContext(bundle.manifest, license);
    
    // 4. Load in sandbox
    const plugin = await this.sandbox.loadPlugin(code, context);
    
    // 5. Initialize plugin
    if (plugin.onActivate) {
      await plugin.onActivate(context);
    }
    
    // 6. Store loaded plugin
    const loaded: LoadedPlugin = {
      id: bundle.manifest.name,
      manifest: bundle.manifest,
      instance: plugin,
      context,
      status: 'active'
    };
    
    this.loadedPlugins.set(loaded.id, loaded);
    return loaded;
  }
  
  private createPluginContext(
    manifest: PluginManifest, 
    license: PluginLicense
  ): PluginContext {
    return {
      plugin: {
        name: manifest.name,
        version: manifest.version,
        permissions: manifest.permissions
      },
      license: {
        type: license.type,
        expiresAt: license.expiresAt,
        limits: license.usageLimits
      },
      api: this.apiBridge.createSecureAPI(manifest.permissions),
      storage: this.createSecureStorage(manifest.name),
      events: this.createSecureEventBus(manifest.name),
      logger: this.createSecureLogger(manifest.name)
    };
  }
}
```

### 2.3 Plugin Component Rendering (UI Plugins)

```typescript
// src/features/plugins/components/PluginRenderer.tsx
import React, { useEffect, useState, Suspense } from 'react';
import { usePluginLoader } from '../hooks/usePluginLoader';
import { ErrorBoundary } from '@/shared/components';
import { LoadingSpinner } from '@/shared/components/ui';

interface PluginRendererProps {
  pluginId: string;
  componentName: string;
  props?: Record<string, any>;
}

export function PluginRenderer({ 
  pluginId, 
  componentName, 
  props = {} 
}: PluginRendererProps) {
  const { loadPlugin, getComponent } = usePluginLoader();
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function load() {
      try {
        await loadPlugin(pluginId);
        const comp = await getComponent(pluginId, componentName);
        setComponent(() => comp);
      } catch (err) {
        setError(err as Error);
      }
    }
    load();
  }, [pluginId, componentName]);
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">
        Failed to load plugin component: {error.message}
      </div>
    );
  }
  
  if (!Component) {
    return <LoadingSpinner />;
  }
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Phase 3: Marketplace Integration (Weeks 7-9)

### 3.1 Marketplace as a System Plugin

Following the innovative "marketplace plugin" approach:

```typescript
// src/features/plugins/system/marketplace/index.ts
export const MarketplacePlugin: SystemPlugin = {
  manifest: {
    name: '@rising-bsm/marketplace',
    version: '1.0.0',
    type: 'mixed',
    author: 'Rising-BSM',
    displayName: 'Plugin Marketplace',
    description: 'Official plugin marketplace and distribution system',
    permissions: ['plugins.manage', 'system.admin'],
    builtin: true,
    exports: {
      components: ['MarketplacePage', 'PluginStore'],
      routes: ['/marketplace/*'],
      services: ['PluginDistribution', 'PluginDiscovery']
    }
  },
  
  // Services provided by marketplace
  services: {
    distribution: new PluginDistributionService(),
    discovery: new PluginDiscoveryService(),
    hosting: new PluginHostingService(),
    reviews: new PluginReviewService()
  },
  
  // UI Components
  components: {
    MarketplacePage: lazy(() => import('./components/MarketplacePage')),
    PluginStore: lazy(() => import('./components/PluginStore')),
    PluginDetail: lazy(() => import('./components/PluginDetail'))
  },
  
  // API Routes
  routes: {
    '/marketplace/search': searchPluginsHandler,
    '/marketplace/download/:id': downloadPluginHandler,
    '/marketplace/install': installPluginHandler,
    '/marketplace/reviews/:id': pluginReviewsHandler
  }
};
```

### 3.2 Plugin Installation Flow

```typescript
// src/features/plugins/lib/services/PluginInstallationService.ts
export class PluginInstallationService {
  async installPlugin(
    pluginId: number,
    licenseKey: string,
    userId: number
  ): Promise<PluginInstallation> {
    try {
      // 1. Verify license
      const license = await this.licenseService.verifyLicense({
        pluginId,
        licenseKey,
        userId,
        hardwareId: await this.getHardwareId()
      });
      
      if (!license.isValid) {
        throw new ServiceError('Invalid license', 403);
      }
      
      // 2. Check installation limits
      if (license.currentInstalls >= license.maxInstalls) {
        throw new ServiceError('Installation limit reached', 403);
      }
      
      // 3. Download plugin bundle
      const bundle = await this.distributionService.downloadBundle(
        pluginId,
        license.downloadToken
      );
      
      // 4. Verify bundle integrity
      const isValid = await this.verifyBundleIntegrity(bundle);
      if (!isValid) {
        throw new ServiceError('Plugin bundle corrupted', 400);
      }
      
      // 5. Extract and install
      const installPath = await this.extractBundle(bundle, pluginId);
      
      // 6. Create installation record
      const installation = await this.repository.create({
        pluginId,
        licenseId: license.id,
        userId,
        hardwareId: await this.getHardwareId(),
        version: bundle.manifest.version,
        status: 'active',
        encryptionKey: await this.generateInstallationKey()
      });
      
      // 7. Load plugin
      await this.pluginLoader.loadPlugin(bundle, license);
      
      // 8. Update license install count
      await this.licenseService.incrementInstalls(license.id);
      
      // 9. Start heartbeat monitoring
      this.startHeartbeat(installation.id);
      
      // 10. Log activity
      await this.activityLog.log({
        userId,
        action: 'plugin.installed',
        entityType: 'Plugin',
        entityId: pluginId,
        metadata: { 
          version: bundle.manifest.version,
          installationId: installation.id 
        }
      });
      
      return installation;
    } catch (error) {
      this.logger.error('Plugin installation failed', { error, pluginId });
      throw error;
    }
  }
}
```

## Phase 4: Developer Tools & SDK (Weeks 10-11)

### 4.1 Plugin Development SDK

```typescript
// @rising-bsm/plugin-sdk package
export abstract class RisingBSMPlugin {
  abstract metadata: PluginMetadata;
  
  // Lifecycle hooks
  async onInstall?(context: PluginContext): Promise<void>;
  async onActivate?(context: PluginContext): Promise<void>;
  async onDeactivate?(): Promise<void>;
  async onUninstall?(): Promise<void>;
  
  // For UI plugins
  components?: Record<string, React.ComponentType>;
  
  // For API plugins
  routes?: Record<string, RouteHandler>;
  
  // For automation plugins
  hooks?: {
    beforeCreate?: Hook<any>;
    afterCreate?: Hook<any>;
    beforeUpdate?: Hook<any>;
    afterUpdate?: Hook<any>;
    beforeDelete?: Hook<any>;
    afterDelete?: Hook<any>;
  };
}

// Example plugin
export default class MyPlugin extends RisingBSMPlugin {
  metadata = {
    name: 'my-awesome-plugin',
    version: '1.0.0',
    displayName: 'My Awesome Plugin',
    description: 'Adds awesome features to Rising-BSM',
    author: 'Developer Name',
    type: 'mixed' as const,
    permissions: ['customers.read', 'appointments.write']
  };
  
  components = {
    Dashboard: MyDashboardWidget,
    Settings: MySettingsPage
  };
  
  routes = {
    '/api/my-plugin/stats': this.handleStats.bind(this)
  };
  
  async onActivate(context: PluginContext) {
    context.logger.info('Plugin activated!');
    
    // Initialize plugin
    await context.storage.set('activated', true);
  }
  
  private async handleStats(req: Request): Promise<Response> {
    const stats = await this.calculateStats();
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 4.2 CLI Tool

```bash
# Plugin development CLI
npm install -g @rising-bsm/cli

# Commands
rising-bsm create my-plugin      # Create new plugin from template
rising-bsm dev                   # Start development server
rising-bsm test                  # Run plugin tests
rising-bsm build                 # Build plugin bundle
rising-bsm publish               # Publish to marketplace
rising-bsm validate              # Validate plugin structure
```

## Phase 5: Security Hardening (Weeks 12-13)

### 5.1 Enhanced Security Measures

```typescript
// Additional security layers
class PluginSecurityManager {
  // Content Security Policy for plugins
  getPluginCSP(pluginId: string): string {
    return `
      default-src 'none';
      script-src 'self' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https://api.rising-bsm.com;
      frame-ancestors 'none';
    `.trim();
  }
  
  // Network request filtering
  async filterNetworkRequest(
    pluginId: string,
    request: Request
  ): Promise<boolean> {
    const allowedHosts = [
      'api.rising-bsm.com',
      'plugins.rising-bsm.com'
    ];
    
    const url = new URL(request.url);
    return allowedHosts.includes(url.hostname);
  }
  
  // Resource usage monitoring
  async checkResourceLimits(
    pluginId: string,
    usage: ResourceUsage
  ): Promise<void> {
    const limits = this.getPluginLimits(pluginId);
    
    if (usage.memory > limits.memory) {
      throw new Error('Memory limit exceeded');
    }
    
    if (usage.cpu > limits.cpu) {
      throw new Error('CPU limit exceeded');
    }
  }
}
```

## Implementation Timeline

### Week 1-3: Foundation
- [ ] Implement secure sandboxing (isolated-vm)
- [ ] Complete repository implementations
- [ ] Fix service layer integration
- [ ] Add comprehensive error handling

### Week 4-6: Runtime
- [ ] Implement plugin loader
- [ ] Create plugin renderer for UI
- [ ] Add API route injection
- [ ] Test plugin execution

### Week 7-9: Marketplace
- [ ] Build marketplace system plugin
- [ ] Implement installation flow
- [ ] Create plugin discovery UI
- [ ] Add license management

### Week 10-11: Developer Tools
- [ ] Create plugin SDK package
- [ ] Build CLI tool
- [ ] Write documentation
- [ ] Create example plugins

### Week 12-13: Security & Testing
- [ ] Security audit
- [ ] Performance testing
- [ ] Integration testing
- [ ] Production hardening

## Best Practices & Recommendations

### 1. Security First
- Never compromise on sandboxing
- Implement defense in depth
- Regular security audits
- Assume plugins are malicious

### 2. Developer Experience
- Clear documentation
- Good error messages
- Fast development cycle
- Rich SDK features

### 3. Performance
- Lazy load plugins
- Cache compiled code
- Monitor resource usage
- Optimize hot paths

### 4. Maintainability
- Follow existing patterns
- Comprehensive testing
- Clear separation of concerns
- Good logging and monitoring

### 5. Scalability
- Design for thousands of plugins
- Efficient storage and retrieval
- CDN for plugin distribution
- Horizontal scaling support

## Risk Mitigation

### Technical Risks
- **Sandbox escape**: Use proven isolation technology
- **Performance impact**: Set strict resource limits
- **Plugin conflicts**: Namespace isolation
- **Version compatibility**: Strict version checking

### Business Risks
- **Plugin quality**: Review process and ratings
- **Malicious plugins**: Security scanning and sandboxing
- **License abuse**: Strong encryption and verification
- **Support burden**: Good documentation and self-service

## Success Metrics

### Technical Metrics
- Plugin load time < 1 second
- Zero sandbox escapes in testing
- 99.9% uptime for plugin runtime
- < 5% performance overhead

### Business Metrics
- 10+ plugins in first 3 months
- 50% of users install at least one plugin
- 5+ third-party developers
- 4.5+ average plugin rating

## Conclusion

This implementation plan provides a clear path from the current metadata-only system to a fully functional, secure, and scalable plugin platform. By following established patterns, implementing proper security measures, and focusing on developer experience, Rising-BSM can build a thriving plugin ecosystem that adds significant value to the platform.

The phased approach ensures that each milestone delivers value while maintaining system stability. The emphasis on security and best practices ensures that the plugin system will be production-ready and maintainable for years to come.