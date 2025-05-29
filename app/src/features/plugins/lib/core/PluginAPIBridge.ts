import { Plugin, PluginPermission } from '@/domain/entities/Plugin';
import { PluginInstallation } from '@/domain/entities/PluginInstallation';
import { ILoggingService } from '@/core/logging';
import { AppError } from '@/core/errors';

export interface APICall {
  endpoint: string;
  method: string;
  params?: any;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
}

export interface APIQuota {
  limit: number;
  used: number;
  resetAt: Date;
}

export interface PluginAPIClient {
  // Customer APIs
  customers: {
    list: (params?: any) => Promise<any>;
    get: (id: number) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<any>;
    delete: (id: number) => Promise<any>;
  };
  
  // Request APIs
  requests: {
    list: (params?: any) => Promise<any>;
    get: (id: number) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<any>;
  };
  
  // Appointment APIs
  appointments: {
    list: (params?: any) => Promise<any>;
    get: (id: number) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<any>;
    cancel: (id: number) => Promise<any>;
  };
  
  // Notification APIs
  notifications: {
    send: (data: any) => Promise<any>;
    list: (params?: any) => Promise<any>;
  };
  
  // Webhook APIs
  webhooks: {
    trigger: (event: string, data: any) => Promise<any>;
  };
  
  // Storage APIs
  storage: {
    upload: (file: any) => Promise<any>;
    download: (id: string) => Promise<any>;
    delete: (id: string) => Promise<any>;
  };
}

export class PluginAPIBridge {
  private apiCallHistory: Map<string, APICall[]> = new Map();
  private apiQuotas: Map<string, APIQuota> = new Map();
  private rateLimitWindow = 60000; // 1 minute
  
  constructor(
    private logger: ILoggingService,
    private serviceFactory: any // Will be the actual service factory
  ) {}

  createAPIClient(plugin: Plugin, installation: PluginInstallation): PluginAPIClient {
    const key = `${plugin.name}:${installation.installationId}`;
    
    return {
      customers: this.createCustomerAPI(plugin, installation),
      requests: this.createRequestAPI(plugin, installation),
      appointments: this.createAppointmentAPI(plugin, installation),
      notifications: this.createNotificationAPI(plugin, installation),
      webhooks: this.createWebhookAPI(plugin, installation),
      storage: this.createStorageAPI(plugin, installation)
    };
  }

  private createCustomerAPI(plugin: Plugin, installation: PluginInstallation) {
    return {
      list: this.wrapAPICall(plugin, installation, 'customers.list', async (params?: any) => {
        this.checkPermission(plugin, 'customers.read');
        const service = this.serviceFactory.createCustomerService();
        return await service.getAll(); // Would need to handle params
      }),
      
      get: this.wrapAPICall(plugin, installation, 'customers.get', async (id: number) => {
        this.checkPermission(plugin, 'customers.read');
        const service = this.serviceFactory.createCustomerService();
        return await service.getById(id);
      }),
      
      create: this.wrapAPICall(plugin, installation, 'customers.create', async (data: any) => {
        this.checkPermission(plugin, 'customers.write');
        const service = this.serviceFactory.createCustomerService();
        return await service.create(data);
      }),
      
      update: this.wrapAPICall(plugin, installation, 'customers.update', async (id: number, data: any) => {
        this.checkPermission(plugin, 'customers.write');
        const service = this.serviceFactory.createCustomerService();
        return await service.update(id, data);
      }),
      
      delete: this.wrapAPICall(plugin, installation, 'customers.delete', async (id: number) => {
        this.checkPermission(plugin, 'customers.delete');
        const service = this.serviceFactory.createCustomerService();
        return await service.delete(id);
      })
    };
  }

  private createRequestAPI(plugin: Plugin, installation: PluginInstallation) {
    return {
      list: this.wrapAPICall(plugin, installation, 'requests.list', async (params?: any) => {
        this.checkPermission(plugin, 'requests.read');
        const service = this.serviceFactory.createRequestService();
        return await service.getAll();
      }),
      
      get: this.wrapAPICall(plugin, installation, 'requests.get', async (id: number) => {
        this.checkPermission(plugin, 'requests.read');
        const service = this.serviceFactory.createRequestService();
        return await service.getById(id);
      }),
      
      create: this.wrapAPICall(plugin, installation, 'requests.create', async (data: any) => {
        this.checkPermission(plugin, 'requests.write');
        const service = this.serviceFactory.createRequestService();
        return await service.create(data);
      }),
      
      update: this.wrapAPICall(plugin, installation, 'requests.update', async (id: number, data: any) => {
        this.checkPermission(plugin, 'requests.write');
        const service = this.serviceFactory.createRequestService();
        return await service.update(id, data);
      })
    };
  }

  private createAppointmentAPI(plugin: Plugin, installation: PluginInstallation) {
    return {
      list: this.wrapAPICall(plugin, installation, 'appointments.list', async (params?: any) => {
        this.checkPermission(plugin, 'appointments.read');
        const service = this.serviceFactory.createAppointmentService();
        return await service.getAll();
      }),
      
      get: this.wrapAPICall(plugin, installation, 'appointments.get', async (id: number) => {
        this.checkPermission(plugin, 'appointments.read');
        const service = this.serviceFactory.createAppointmentService();
        return await service.getById(id);
      }),
      
      create: this.wrapAPICall(plugin, installation, 'appointments.create', async (data: any) => {
        this.checkPermission(plugin, 'appointments.write');
        const service = this.serviceFactory.createAppointmentService();
        return await service.create(data);
      }),
      
      update: this.wrapAPICall(plugin, installation, 'appointments.update', async (id: number, data: any) => {
        this.checkPermission(plugin, 'appointments.write');
        const service = this.serviceFactory.createAppointmentService();
        return await service.update(id, data);
      }),
      
      cancel: this.wrapAPICall(plugin, installation, 'appointments.cancel', async (id: number) => {
        this.checkPermission(plugin, 'appointments.write');
        const service = this.serviceFactory.createAppointmentService();
        return await service.update(id, { status: 'cancelled' });
      })
    };
  }

  private createNotificationAPI(plugin: Plugin, installation: PluginInstallation) {
    return {
      send: this.wrapAPICall(plugin, installation, 'notifications.send', async (data: any) => {
        this.checkPermission(plugin, 'notifications.send');
        const service = this.serviceFactory.createNotificationService();
        return await service.create({
          userId: installation.userId,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          source: `plugin:${plugin.name}`,
          entityType: data.entityType,
          entityId: data.entityId
        });
      }),
      
      list: this.wrapAPICall(plugin, installation, 'notifications.list', async (params?: any) => {
        this.checkPermission(plugin, 'notifications.read');
        const service = this.serviceFactory.createNotificationService();
        return await service.getByUser(installation.userId);
      })
    };
  }

  private createWebhookAPI(plugin: Plugin, installation: PluginInstallation) {
    return {
      trigger: this.wrapAPICall(plugin, installation, 'webhooks.trigger', async (event: string, data: any) => {
        this.checkPermission(plugin, 'webhooks.trigger');
        
        // Log the webhook trigger
        this.logger.info(`Plugin ${plugin.name} triggered webhook: ${event}`, data);
        
        // In a real implementation, this would call the automation service
        // to trigger webhooks configured for this event
        return { success: true, event, data };
      })
    };
  }

  private createStorageAPI(plugin: Plugin, installation: PluginInstallation) {
    const storagePath = `/app/storage/plugins/${plugin.name}/${installation.installationId}`;
    
    return {
      upload: this.wrapAPICall(plugin, installation, 'storage.upload', async (file: any) => {
        this.checkPermission(plugin, 'storage.write');
        this.checkStorageQuota(plugin, installation, file.size);
        
        // In a real implementation, this would handle file uploads
        // For now, return a mock response
        return {
          id: `file_${Date.now()}`,
          name: file.name,
          size: file.size,
          path: `${storagePath}/${file.name}`
        };
      }),
      
      download: this.wrapAPICall(plugin, installation, 'storage.download', async (id: string) => {
        this.checkPermission(plugin, 'storage.read');
        
        // In a real implementation, this would return file data
        return { id, data: 'mock file data' };
      }),
      
      delete: this.wrapAPICall(plugin, installation, 'storage.delete', async (id: string) => {
        this.checkPermission(plugin, 'storage.delete');
        
        // In a real implementation, this would delete the file
        return { success: true, id };
      })
    };
  }

  private wrapAPICall<T extends (...args: any[]) => Promise<any>>(
    plugin: Plugin,
    installation: PluginInstallation,
    endpoint: string,
    fn: T
  ): T {
    return (async (...args: any[]) => {
      const startTime = Date.now();
      const key = `${plugin.name}:${installation.installationId}`;
      
      try {
        // Check rate limits
        this.checkRateLimit(plugin, installation, endpoint);
        
        // Execute API call
        const result = await fn(...args);
        
        // Record successful call
        this.recordAPICall(key, {
          endpoint,
          method: fn.name,
          params: args,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          success: true
        });
        
        return result;
      } catch (error) {
        // Record failed call
        this.recordAPICall(key, {
          endpoint,
          method: fn.name,
          params: args,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        throw error;
      }
    }) as T;
  }

  private checkPermission(plugin: Plugin, permission: string): void {
    const hasPermission = plugin.permissions.some(p => 
      p.code === permission || 
      p.code === `${permission.split('.')[0]}.*` ||
      p.code === '*'
    );
    
    if (!hasPermission) {
      throw new AppError(`Plugin does not have permission: ${permission}`, 403);
    }
  }

  private checkRateLimit(plugin: Plugin, installation: PluginInstallation, endpoint: string): void {
    const key = `${plugin.name}:${installation.installationId}`;
    const now = Date.now();
    
    // Get recent API calls
    const history = this.apiCallHistory.get(key) || [];
    const recentCalls = history.filter(call => 
      now - call.timestamp.getTime() < this.rateLimitWindow
    );
    
    // Check endpoint-specific limits
    const endpointCalls = recentCalls.filter(call => call.endpoint === endpoint);
    const endpointLimit = this.getEndpointLimit(endpoint);
    
    if (endpointCalls.length >= endpointLimit) {
      throw new AppError(`Rate limit exceeded for ${endpoint}`, 429);
    }
    
    // Check global limits
    const globalLimit = this.getGlobalLimit(plugin);
    if (recentCalls.length >= globalLimit) {
      throw new AppError('Global API rate limit exceeded', 429);
    }
  }

  private checkStorageQuota(plugin: Plugin, installation: PluginInstallation, size: number): void {
    const key = `${plugin.name}:${installation.installationId}`;
    const quota = this.apiQuotas.get(key) || {
      limit: 10 * 1024 * 1024, // 10MB default
      used: 0,
      resetAt: new Date(Date.now() + 86400000) // 24 hours
    };
    
    if (quota.used + size > quota.limit) {
      throw new AppError('Storage quota exceeded', 413);
    }
    
    quota.used += size;
    this.apiQuotas.set(key, quota);
  }

  private recordAPICall(key: string, call: APICall): void {
    const history = this.apiCallHistory.get(key) || [];
    history.push(call);
    
    // Keep only recent history (last 1000 calls or last hour)
    const cutoff = Date.now() - 3600000;
    const recentHistory = history.filter(c => 
      c.timestamp.getTime() > cutoff
    ).slice(-1000);
    
    this.apiCallHistory.set(key, recentHistory);
  }

  private getEndpointLimit(endpoint: string): number {
    // Define endpoint-specific limits
    const limits: Record<string, number> = {
      'customers.list': 100,
      'customers.get': 1000,
      'customers.create': 10,
      'customers.update': 100,
      'customers.delete': 10,
      'requests.list': 100,
      'requests.get': 1000,
      'requests.create': 50,
      'requests.update': 100,
      'appointments.list': 100,
      'appointments.get': 1000,
      'appointments.create': 50,
      'appointments.update': 100,
      'appointments.cancel': 50,
      'notifications.send': 100,
      'notifications.list': 100,
      'webhooks.trigger': 100,
      'storage.upload': 10,
      'storage.download': 100,
      'storage.delete': 50
    };
    
    return limits[endpoint] || 100; // Default limit
  }

  private getGlobalLimit(plugin: Plugin): number {
    // Define limits based on plugin license type
    const hasPaidTiers = plugin.pricing.basic || plugin.pricing.premium || plugin.pricing.enterprise;
    const licenseType = hasPaidTiers ? 'premium' : 'free';
    const limits: Record<string, number> = {
      'free': 1000,
      'premium': 10000,
      'enterprise': 100000
    };
    
    return limits[licenseType] || 1000;
  }

  // Public methods for monitoring
  getAPICallHistory(pluginName: string, installationId: string): APICall[] {
    const key = `${pluginName}:${installationId}`;
    return this.apiCallHistory.get(key) || [];
  }

  getAPIQuota(pluginName: string, installationId: string): APIQuota | null {
    const key = `${pluginName}:${installationId}`;
    return this.apiQuotas.get(key) || null;
  }

  resetAPIQuota(pluginName: string, installationId: string): void {
    const key = `${pluginName}:${installationId}`;
    this.apiQuotas.delete(key);
  }
}