# Implementing a New Feature

This guide provides a step-by-step walkthrough for implementing a new feature in the Rising-BSM application following the feature-based architecture pattern.

## Example: Implementing a "Reports" Feature

Let's create a new feature for generating and viewing reports in the application.

### Step 1: Create the Feature Directory Structure

```bash
mkdir -p src/features/reports/{api/{models,routes},components,hooks,lib/{clients,repositories,services},providers,utils}
touch src/features/reports/index.ts
```

### Step 2: Define Domain Interfaces and DTOs

First, define the interfaces and DTOs in the domain layer.

```typescript
// domain/dtos/ReportDtos.ts
export interface ReportDto {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  createdAt: Date;
  createdBy: string;
  parameters: Record<string, any>;
  results?: Record<string, any>;
}

export interface CreateReportDto {
  name: string;
  description: string;
  type: ReportType;
  parameters: Record<string, any>;
}

export enum ReportType {
  SALES = 'sales',
  CUSTOMER_ACTIVITY = 'customer_activity',
  USER_PERFORMANCE = 'user_performance',
  CUSTOM = 'custom'
}

// domain/services/IReportService.ts
import { CreateReportDto, ReportDto, ReportType } from '@/domain/dtos/ReportDtos';

export interface IReportService {
  getReports(): Promise<ReportDto[]>;
  getReportById(id: string): Promise<ReportDto | null>;
  getReportsByType(type: ReportType): Promise<ReportDto[]>;
  createReport(data: CreateReportDto): Promise<ReportDto>;
  generateReport(id: string): Promise<ReportDto>;
  deleteReport(id: string): Promise<void>;
}

// domain/repositories/IReportRepository.ts
import { Report } from '@/domain/entities/Report';
import { ReportType } from '@/domain/dtos/ReportDtos';

export interface IReportRepository {
  findMany(filter?: { type?: ReportType }): Promise<Report[]>;
  findById(id: string): Promise<Report | null>;
  create(data: Partial<Report>): Promise<Report>;
  update(id: string, data: Partial<Report>): Promise<Report>;
  delete(id: string): Promise<void>;
}
```

### Step 3: Create the Entity

```typescript
// domain/entities/Report.ts
import { BaseEntity } from '@/domain/entities/BaseEntity';
import { ReportType } from '@/domain/dtos/ReportDtos';

export class Report extends BaseEntity {
  name: string;
  description: string;
  type: ReportType;
  parameters: Record<string, any>;
  results?: Record<string, any>;
  createdBy: string;
  
  constructor(data: Partial<Report>) {
    super(data);
    this.name = data.name || '';
    this.description = data.description || '';
    this.type = data.type || ReportType.CUSTOM;
    this.parameters = data.parameters || {};
    this.results = data.results;
    this.createdBy = data.createdBy || '';
  }
}
```

### Step 4: Implement the Repository

```typescript
// features/reports/lib/repositories/ReportRepository.ts
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { Report } from '@/domain/entities/Report';
import { IReportRepository } from '@/domain/repositories/IReportRepository';
import { ReportType } from '@/domain/dtos/ReportDtos';
import { prisma } from '@/core/db/prisma/server-client';
import { PrismaClient } from '@prisma/client';
import { AppError } from '@/types/errors';

export class ReportRepository 
  extends PrismaRepository<Report>
  implements IReportRepository {
  
  constructor() {
    super(prisma.report);
  }
  
  async findMany(filter?: { type?: ReportType }): Promise<Report[]> {
    try {
      const reports = await this.prismaModel.findMany({
        where: {
          ...(filter?.type ? { type: filter.type } : {})
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return reports.map(report => new Report(report));
    } catch (error) {
      console.error('Error in ReportRepository.findMany:', error);
      throw new AppError('Failed to fetch reports', 500, error);
    }
  }
  
  async findById(id: string): Promise<Report | null> {
    try {
      const report = await this.prismaModel.findUnique({
        where: { id }
      });
      
      return report ? new Report(report) : null;
    } catch (error) {
      console.error(`Error in ReportRepository.findById for ID ${id}:`, error);
      throw new AppError(`Failed to fetch report with ID ${id}`, 500, error);
    }
  }
  
  async create(data: Partial<Report>): Promise<Report> {
    try {
      const report = await this.prismaModel.create({
        data: {
          name: data.name || '',
          description: data.description || '',
          type: data.type || ReportType.CUSTOM,
          parameters: data.parameters || {},
          results: data.results,
          createdBy: data.createdBy || ''
        }
      });
      
      return new Report(report);
    } catch (error) {
      console.error('Error in ReportRepository.create:', error);
      throw new AppError('Failed to create report', 500, error);
    }
  }
  
  async update(id: string, data: Partial<Report>): Promise<Report> {
    try {
      const report = await this.prismaModel.update({
        where: { id },
        data
      });
      
      return new Report(report);
    } catch (error) {
      console.error(`Error in ReportRepository.update for ID ${id}:`, error);
      throw new AppError(`Failed to update report with ID ${id}`, 500, error);
    }
  }
  
  async delete(id: string): Promise<void> {
    try {
      await this.prismaModel.delete({ where: { id } });
    } catch (error) {
      console.error(`Error in ReportRepository.delete for ID ${id}:`, error);
      throw new AppError(`Failed to delete report with ID ${id}`, 500, error);
    }
  }
}
```

### Step 5: Implement the Service

```typescript
// features/reports/lib/services/ReportService.server.ts
import { IReportService } from '@/domain/services/IReportService';
import { IReportRepository } from '@/domain/repositories/IReportRepository';
import { CreateReportDto, ReportDto, ReportType } from '@/domain/dtos/ReportDtos';
import { Report } from '@/domain/entities/Report';
import { BaseService } from '@/core/services/BaseService';
import { LoggingService } from '@/core/logging/LoggingService';
import { AppError } from '@/types/errors';

export class ReportService extends BaseService implements IReportService {
  private reportRepository: IReportRepository;
  private logger: LoggingService;
  
  constructor(reportRepository: IReportRepository, logger: LoggingService) {
    super();
    this.reportRepository = reportRepository;
    this.logger = logger;
  }
  
  async getReports(): Promise<ReportDto[]> {
    try {
      this.logger.info('Fetching all reports');
      const reports = await this.reportRepository.findMany();
      return reports.map(report => this.mapToDto(report));
    } catch (error) {
      this.logger.error('Error fetching reports', error);
      throw new AppError('Failed to fetch reports', 500, error);
    }
  }
  
  async getReportById(id: string): Promise<ReportDto | null> {
    try {
      this.logger.info(`Fetching report with ID ${id}`);
      const report = await this.reportRepository.findById(id);
      return report ? this.mapToDto(report) : null;
    } catch (error) {
      this.logger.error(`Error fetching report with ID ${id}`, error);
      throw new AppError(`Failed to fetch report with ID ${id}`, 500, error);
    }
  }
  
  async getReportsByType(type: ReportType): Promise<ReportDto[]> {
    try {
      this.logger.info(`Fetching reports of type ${type}`);
      const reports = await this.reportRepository.findMany({ type });
      return reports.map(report => this.mapToDto(report));
    } catch (error) {
      this.logger.error(`Error fetching reports of type ${type}`, error);
      throw new AppError(`Failed to fetch reports of type ${type}`, 500, error);
    }
  }
  
  async createReport(data: CreateReportDto): Promise<ReportDto> {
    try {
      this.logger.info('Creating new report', { data });
      
      // Additional validation
      if (!data.name) {
        throw new AppError('Report name is required', 400);
      }
      
      const newReport = new Report({
        name: data.name,
        description: data.description,
        type: data.type,
        parameters: data.parameters,
        createdBy: this.getCurrentUserId()
      });
      
      const report = await this.reportRepository.create(newReport);
      return this.mapToDto(report);
    } catch (error) {
      this.logger.error('Error creating report', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create report', 500, error);
    }
  }
  
  async generateReport(id: string): Promise<ReportDto> {
    try {
      this.logger.info(`Generating report with ID ${id}`);
      const report = await this.reportRepository.findById(id);
      if (!report) {
        throw new AppError('Report not found', 404);
      }
      
      // Generate report results based on type and parameters
      const results = await this.generateReportResults(report);
      
      // Update the report with results
      const updatedReport = await this.reportRepository.update(id, {
        results
      });
      
      return this.mapToDto(updatedReport);
    } catch (error) {
      this.logger.error(`Error generating report with ID ${id}`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to generate report with ID ${id}`, 500, error);
    }
  }
  
  async deleteReport(id: string): Promise<void> {
    try {
      this.logger.info(`Deleting report with ID ${id}`);
      await this.reportRepository.delete(id);
    } catch (error) {
      this.logger.error(`Error deleting report with ID ${id}`, error);
      throw new AppError(`Failed to delete report with ID ${id}`, 500, error);
    }
  }
  
  private async generateReportResults(report: Report): Promise<Record<string, any>> {
    try {
      // Logic to generate report results based on type and parameters
      this.logger.info(`Generating results for report type ${report.type}`);
      
      switch (report.type) {
        case ReportType.SALES:
          return this.generateSalesReport(report.parameters);
        case ReportType.CUSTOMER_ACTIVITY:
          return this.generateCustomerActivityReport(report.parameters);
        case ReportType.USER_PERFORMANCE:
          return this.generateUserPerformanceReport(report.parameters);
        case ReportType.CUSTOM:
        default:
          return this.generateCustomReport(report.parameters);
      }
    } catch (error) {
      this.logger.error(`Error generating results for report type ${report.type}`, error);
      throw new AppError(`Failed to generate results for report type ${report.type}`, 500, error);
    }
  }
  
  private generateSalesReport(parameters: Record<string, any>): Promise<Record<string, any>> {
    // Implementation for generating sales report
    return Promise.resolve({ /* report data */ });
  }
  
  private generateCustomerActivityReport(parameters: Record<string, any>): Promise<Record<string, any>> {
    // Implementation for generating customer activity report
    return Promise.resolve({ /* report data */ });
  }
  
  private generateUserPerformanceReport(parameters: Record<string, any>): Promise<Record<string, any>> {
    // Implementation for generating user performance report
    return Promise.resolve({ /* report data */ });
  }
  
  private generateCustomReport(parameters: Record<string, any>): Promise<Record<string, any>> {
    // Implementation for generating custom report
    return Promise.resolve({ /* report data */ });
  }
  
  private mapToDto(report: Report): ReportDto {
    return {
      id: report.id,
      name: report.name,
      description: report.description,
      type: report.type,
      createdAt: report.createdAt,
      createdBy: report.createdBy,
      parameters: report.parameters,
      results: report.results
    };
  }
}
```

### Step 6: Implement API Client

```typescript
// features/reports/lib/clients/ReportClient.ts
import { ApiClient } from '@/core/api/ApiClient';
import { CreateReportDto, ReportDto, ReportType } from '@/domain/dtos/ReportDtos';
import { AppError } from '@/types/errors';

export class ReportClient {
  private apiClient: ApiClient;
  private baseUrl = '/api/reports';
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }
  
  async getReports(): Promise<ReportDto[]> {
    try {
      return await this.apiClient.get<ReportDto[]>(this.baseUrl);
    } catch (error) {
      console.error('Error in ReportClient.getReports:', error);
      throw new AppError('Failed to fetch reports', error.status || 500, error);
    }
  }
  
  async getReportById(id: string): Promise<ReportDto> {
    try {
      return await this.apiClient.get<ReportDto>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Error in ReportClient.getReportById for ID ${id}:`, error);
      throw new AppError(`Failed to fetch report with ID ${id}`, error.status || 500, error);
    }
  }
  
  async getReportsByType(type: ReportType): Promise<ReportDto[]> {
    try {
      return await this.apiClient.get<ReportDto[]>(`${this.baseUrl}/by-type/${type}`);
    } catch (error) {
      console.error(`Error in ReportClient.getReportsByType for type ${type}:`, error);
      throw new AppError(`Failed to fetch reports of type ${type}`, error.status || 500, error);
    }
  }
  
  async createReport(data: CreateReportDto): Promise<ReportDto> {
    try {
      return await this.apiClient.post<ReportDto>(this.baseUrl, data);
    } catch (error) {
      console.error('Error in ReportClient.createReport:', error);
      throw new AppError('Failed to create report', error.status || 500, error);
    }
  }
  
  async generateReport(id: string): Promise<ReportDto> {
    try {
      return await this.apiClient.post<ReportDto>(`${this.baseUrl}/${id}/generate`, {});
    } catch (error) {
      console.error(`Error in ReportClient.generateReport for ID ${id}:`, error);
      throw new AppError(`Failed to generate report with ID ${id}`, error.status || 500, error);
    }
  }
  
  async deleteReport(id: string): Promise<void> {
    try {
      return await this.apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Error in ReportClient.deleteReport for ID ${id}:`, error);
      throw new AppError(`Failed to delete report with ID ${id}`, error.status || 500, error);
    }
  }
}
```

### Step 7: Create API Routes

```typescript
// features/reports/api/models/report-request-models.ts
import { CreateReportDto, ReportType } from '@/domain/dtos/ReportDtos';

export interface CreateReportRequest extends CreateReportDto {}

// features/reports/api/models/report-response-models.ts
import { ReportDto } from '@/domain/dtos/ReportDtos';

export interface ReportResponse extends ReportDto {}
export type ReportsResponse = ReportResponse[];

// features/reports/api/routes/get-reports-route.ts
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/route-handler';
import { ReportsResponse } from '../models/report-response-models';
import { getReportService } from '../../lib/services';
import { LoggingService } from '@/core/logging/LoggingService';

export const getReportsRoute = routeHandler<ReportsResponse>({
  GET: async (req: NextRequest) => {
    const logger = new LoggingService('ReportsAPI');
    logger.info('GET /api/reports - Fetching all reports');
    
    try {
      const reportService = getReportService();
      const reports = await reportService.getReports();
      return { data: reports };
    } catch (error) {
      logger.error('Error handling GET /api/reports:', error);
      return { 
        status: error.status || 500, 
        error: error.message || 'Failed to fetch reports' 
      };
    }
  }
});

// features/reports/api/routes/get-report-route.ts
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/route-handler';
import { ReportResponse } from '../models/report-response-models';
import { getReportService } from '../../lib/services';
import { LoggingService } from '@/core/logging/LoggingService';

export const getReportRoute = routeHandler<ReportResponse>({
  GET: async (req: NextRequest, { params }: { params: { id: string } }) => {
    const logger = new LoggingService('ReportsAPI');
    logger.info(`GET /api/reports/${params.id} - Fetching report by ID`);
    
    try {
      const reportService = getReportService();
      const report = await reportService.getReportById(params.id);
      
      if (!report) {
        logger.warn(`Report with ID ${params.id} not found`);
        return { status: 404, error: 'Report not found' };
      }
      
      return { data: report };
    } catch (error) {
      logger.error(`Error handling GET /api/reports/${params.id}:`, error);
      return { 
        status: error.status || 500, 
        error: error.message || `Failed to fetch report with ID ${params.id}` 
      };
    }
  }
});

// features/reports/api/routes/create-report-route.ts
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/route-handler';
import { ReportResponse } from '../models/report-response-models';
import { CreateReportRequest } from '../models/report-request-models';
import { getReportService } from '../../lib/services';
import { LoggingService } from '@/core/logging/LoggingService';

export const createReportRoute = routeHandler<ReportResponse, CreateReportRequest>({
  POST: async (req: NextRequest) => {
    const logger = new LoggingService('ReportsAPI');
    logger.info('POST /api/reports - Creating new report');
    
    try {
      const reportService = getReportService();
      const data = await req.json();
      
      // Basic validation
      if (!data.name) {
        logger.warn('Report creation failed: Missing required field "name"');
        return { status: 400, error: 'Name is required' };
      }
      
      const report = await reportService.createReport(data);
      return { data: report, status: 201 };
    } catch (error) {
      logger.error('Error handling POST /api/reports:', error);
      return { 
        status: error.status || 500, 
        error: error.message || 'Failed to create report' 
      };
    }
  }
});

// features/reports/api/routes/generate-report-route.ts
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/route-handler';
import { ReportResponse } from '../models/report-response-models';
import { getReportService } from '../../lib/services';
import { LoggingService } from '@/core/logging/LoggingService';

export const generateReportRoute = routeHandler<ReportResponse>({
  POST: async (req: NextRequest, { params }: { params: { id: string } }) => {
    const logger = new LoggingService('ReportsAPI');
    logger.info(`POST /api/reports/${params.id}/generate - Generating report`);
    
    try {
      const reportService = getReportService();
      const report = await reportService.generateReport(params.id);
      return { data: report };
    } catch (error) {
      logger.error(`Error handling POST /api/reports/${params.id}/generate:`, error);
      
      if (error.status === 404) {
        return { status: 404, error: 'Report not found' };
      }
      
      return { 
        status: error.status || 500, 
        error: error.message || `Failed to generate report with ID ${params.id}` 
      };
    }
  }
});

// features/reports/api/routes/delete-report-route.ts
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/route-handler';
import { getReportService } from '../../lib/services';
import { LoggingService } from '@/core/logging/LoggingService';

export const deleteReportRoute = routeHandler<void>({
  DELETE: async (req: NextRequest, { params }: { params: { id: string } }) => {
    const logger = new LoggingService('ReportsAPI');
    logger.info(`DELETE /api/reports/${params.id} - Deleting report`);
    
    try {
      const reportService = getReportService();
      await reportService.deleteReport(params.id);
      return { status: 204 };
    } catch (error) {
      logger.error(`Error handling DELETE /api/reports/${params.id}:`, error);
      return { 
        status: error.status || 500, 
        error: error.message || `Failed to delete report with ID ${params.id}` 
      };
    }
  }
});

// features/reports/api/routes/index.ts
export * from './get-reports-route';
export * from './get-report-route';
export * from './create-report-route';
export * from './generate-report-route';
export * from './delete-report-route';
```

### Step 8: Implement Permission Integration

```typescript
// features/reports/lib/utils/reportPermissions.ts
import { SystemPermissionMap } from '@/domain/permissions/SystemPermissionMap';

export const ReportPermissions = {
  VIEW_REPORTS: 'reports.view',
  CREATE_REPORT: 'reports.create',
  GENERATE_REPORT: 'reports.generate',
  DELETE_REPORT: 'reports.delete'
};

// Register report permissions with the system
SystemPermissionMap.register(ReportPermissions);

// features/reports/components/PermissionGuarded.tsx
import React from 'react';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { ReportPermissions } from '../lib/utils/reportPermissions';

interface PermissionGuardedProps {
  permission: keyof typeof ReportPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ReportPermissionGuarded({ permission, children, fallback }: PermissionGuardedProps) {
  return (
    <PermissionGuard permission={ReportPermissions[permission]} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
```

### Step 9: Set Up React Hooks

```typescript
// features/reports/hooks/useReports.ts
import { useState, useCallback, useEffect } from 'react';
import { ReportDto, ReportType, CreateReportDto } from '@/domain/dtos/ReportDtos';
import { ReportClient } from '../lib/clients/ReportClient';
import { useApiClient } from '@/shared/hooks/useApiClient';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { ReportPermissions } from '../lib/utils/reportPermissions';

export function useReports() {
  const apiClient = useApiClient();
  const reportClient = new ReportClient(apiClient);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const [reports, setReports] = useState<ReportDto[]>([]);
  const [currentReport, setCurrentReport] = useState<ReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Check permissions
  const [canView, setCanView] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canGenerate, setCanGenerate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  
  // Load permissions
  useEffect(() => {
    async function checkPermissions() {
      setCanView(await hasPermission(ReportPermissions.VIEW_REPORTS));
      setCanCreate(await hasPermission(ReportPermissions.CREATE_REPORT));
      setCanGenerate(await hasPermission(ReportPermissions.GENERATE_REPORT));
      setCanDelete(await hasPermission(ReportPermissions.DELETE_REPORT));
    }
    
    checkPermissions();
  }, [hasPermission]);
  
  const fetchReports = useCallback(async () => {
    if (!canView) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to view reports',
        variant: 'destructive',
      });
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await reportClient.getReports();
      setReports(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [reportClient, toast, canView]);
  
  const fetchReportById = useCallback(async (id: string) => {
    if (!canView) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to view reports',
        variant: 'destructive',
      });
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await reportClient.getReportById(id);
      setCurrentReport(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch report ${id}`;
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [reportClient, toast, canView]);
  
  const fetchReportsByType = useCallback(async (type: ReportType) => {
    if (!canView) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to view reports',
        variant: 'destructive',
      });
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await reportClient.getReportsByType(type);
      setReports(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch reports of type ${type}`;
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [reportClient, toast, canView]);
  
  const createReport = useCallback(async (data: CreateReportDto) => {
    if (!canCreate) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to create reports',
        variant: 'destructive',
      });
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const newReport = await reportClient.createReport(data);
      setReports(prev => [...prev, newReport]);
      toast({
        title: 'Success',
        description: 'Report created successfully',
      });
      return newReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create report';
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [reportClient, toast, canCreate]);
  
  const generateReport = useCallback(async (id: string) => {
    if (!canGenerate) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to generate reports',
        variant: 'destructive',
      });
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const report = await reportClient.generateReport(id);
      setReports(prev => prev.map(r => r.id === id ? report : r));
      setCurrentReport(report);
      toast({
        title: 'Success',
        description: 'Report generated successfully',
      });
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to generate report ${id}`;
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [reportClient, toast, canGenerate]);
  
  const deleteReport = useCallback(async (id: string) => {
    if (!canDelete) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to delete reports',
        variant: 'destructive',
      });
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await reportClient.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      if (currentReport?.id === id) {
        setCurrentReport(null);
      }
      toast({
        title: 'Success',
        description: 'Report deleted successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to delete report ${id}`;
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [reportClient, toast, currentReport, canDelete]);
  
  return {
    reports,
    currentReport,
    loading,
    error,
    permissions: {
      canView,
      canCreate,
      canGenerate,
      canDelete
    },
    fetchReports,
    fetchReportById,
    fetchReportsByType,
    createReport,
    generateReport,
    deleteReport
  };
}

// features/reports/hooks/index.ts
export * from './useReports';
```

### Step 10: Create React Components

```typescript
// features/reports/components/ReportList.tsx
import React, { useEffect } from 'react';
import { useReports } from '../hooks/useReports';
import { ReportType } from '@/domain/dtos/ReportDtos';
import { ReportPermissionGuarded } from './PermissionGuarded';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NoPermissionView } from '@/shared/components/NoPermissionView';
import { useRouter } from 'next/navigation';

export function ReportList() {
  const { reports, loading, error, permissions, fetchReports } = useReports();
  const router = useRouter();
  
  useEffect(() => {
    if (permissions.canView) {
      fetchReports();
    }
  }, [fetchReports, permissions.canView]);
  
  if (!permissions.canView) {
    return (
      <NoPermissionView 
        title="Access Denied" 
        message="You do not have permission to view reports" 
      />
    );
  }
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <div className="error-container">Error loading reports: {error.message}</div>;
  }
  
  if (!reports.length) {
    return <div className="empty-state">No reports found.</div>;
  }
  
  const handleReportClick = (id: string) => {
    router.push(`/dashboard/reports/${id}`);
  };
  
  return (
    <div className="report-list">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
        <ReportPermissionGuarded permission="CREATE_REPORT">
          <button
            className="btn btn-primary"
            onClick={() => router.push('/dashboard/reports/new')}
          >
            Create New Report
          </button>
        </ReportPermissionGuarded>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(report => (
          <div 
            key={report.id} 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleReportClick(report.id)}
          >
            <div className="card-body">
              <h3 className="card-title">{report.name}</h3>
              <p className="text-sm text-gray-500">{report.description}</p>
              <div className="mt-4">
                <span className="badge badge-secondary">{report.type}</span>
                <span className="text-xs text-gray-400 block mt-2">
                  Created: {new Date(report.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Implement other components similarly with proper error handling, 
// loading states, and permission checks
```

### Step 11: Implement Client/Server Service Factory Methods

```typescript
// features/reports/lib/services/index.ts
import { ReportRepository } from '../repositories/ReportRepository';
import { ReportService } from './ReportService.server';
import { LoggingService } from '@/core/logging/LoggingService';

// Server-side factory function
export function getReportService() {
  const logger = new LoggingService('ReportService');
  const reportRepository = new ReportRepository();
  return new ReportService(reportRepository, logger);
}

// features/reports/lib/services/ReportService.client.ts
// This is a stub for client-side functionality that doesn't require server access
import { IReportService } from '@/domain/services/IReportService';
import { CreateReportDto, ReportDto, ReportType } from '@/domain/dtos/ReportDtos';

export class ReportServiceClient implements Partial<IReportService> {
  // Implement any client-side only functionality here
  // For example, local filtering or sorting of reports that are already loaded
  
  filterReportsByKeyword(reports: ReportDto[], keyword: string): ReportDto[] {
    if (!keyword) return reports;
    
    const lowerKeyword = keyword.toLowerCase();
    return reports.filter(report => 
      report.name.toLowerCase().includes(lowerKeyword) || 
      report.description.toLowerCase().includes(lowerKeyword)
    );
  }
  
  sortReports(reports: ReportDto[], sortBy: 'name' | 'date' | 'type', ascending: boolean = true): ReportDto[] {
    const sortedReports = [...reports];
    
    switch (sortBy) {
      case 'name':
        sortedReports.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date':
        sortedReports.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'type':
        sortedReports.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }
    
    return ascending ? sortedReports : sortedReports.reverse();
  }
}

// Client-side factory function for partial functionality
export function getReportServiceClient() {
  return new ReportServiceClient();
}
```

### Step 12: Define API Routes in Next.js App Router

```typescript
// app/api/reports/route.ts
import { createReportRoute, getReportsRoute } from '@/features/reports/api/routes';

export const GET = getReportsRoute.GET;
export const POST = createReportRoute.POST;

// app/api/reports/[id]/route.ts
import { deleteReportRoute, getReportRoute } from '@/features/reports/api/routes';

export const GET = getReportRoute.GET;
export const DELETE = deleteReportRoute.DELETE;

// app/api/reports/[id]/generate/route.ts
import { generateReportRoute } from '@/features/reports/api/routes';

export const POST = generateReportRoute.POST;

// app/api/reports/by-type/[type]/route.ts
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/route-handler';
import { ReportsResponse } from '@/features/reports/api/models/report-response-models';
import { getReportService } from '@/features/reports/lib/services';
import { ReportType } from '@/domain/dtos/ReportDtos';
import { LoggingService } from '@/core/logging/LoggingService';

export const GET = routeHandler<ReportsResponse>({
  GET: async (req: NextRequest, { params }: { params: { type: string } }) => {
    const logger = new LoggingService('ReportsAPI');
    logger.info(`GET /api/reports/by-type/${params.type} - Fetching reports by type`);
    
    try {
      const reportService = getReportService();
      const type = params.type as ReportType;
      
      if (!Object.values(ReportType).includes(type)) {
        logger.warn(`Invalid report type: ${params.type}`);
        return { status: 400, error: 'Invalid report type' };
      }
      
      const reports = await reportService.getReportsByType(type);
      return { data: reports };
    } catch (error) {
      logger.error(`Error handling GET /api/reports/by-type/${params.type}:`, error);
      return { 
        status: error.status || 500, 
        error: error.message || `Failed to fetch reports of type ${params.type}` 
      };
    }
  }
}).GET;
```

### Step 13: Create Dashboard Pages

```typescript
// app/dashboard/reports/page.tsx
import React from 'react';
import { ReportList } from '@/features/reports/components';
import { ServerErrorBoundary } from '@/shared/components/errors/ServerErrorBoundary';

export default function ReportsPage() {
  return (
    <ServerErrorBoundary fallback={<div>Error loading Reports page</div>}>
      <div className="reports-page">
        <h1 className="text-3xl font-bold mb-6">Reports</h1>
        <ReportList />
      </div>
    </ServerErrorBoundary>
  );
}

// app/dashboard/reports/new/page.tsx
import React from 'react';
import { ReportForm } from '@/features/reports/components';
import { redirect } from 'next/navigation';
import { ServerErrorBoundary } from '@/shared/components/errors/ServerErrorBoundary';

export default function NewReportPage() {
  const handleSuccess = () => {
    redirect('/dashboard/reports');
  };
  
  return (
    <ServerErrorBoundary fallback={<div>Error creating new report</div>}>
      <div className="new-report-page">
        <h1 className="text-3xl font-bold mb-6">Create New Report</h1>
        <ReportForm onSuccess={handleSuccess} />
      </div>
    </ServerErrorBoundary>
  );
}

// app/dashboard/reports/[id]/page.tsx
import React from 'react';
import { ReportDetail } from '@/features/reports/components';
import { ServerErrorBoundary } from '@/shared/components/errors/ServerErrorBoundary';

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  return (
    <ServerErrorBoundary fallback={<div>Error loading report details</div>}>
      <div className="report-detail-page">
        <h1 className="text-3xl font-bold mb-6">Report Details</h1>
        <ReportDetail reportId={params.id} />
      </div>
    </ServerErrorBoundary>
  );
}
```

### Step 14: Implement Tests

```typescript
// features/reports/lib/services/__tests__/ReportService.test.ts
import { ReportService } from '../ReportService.server';
import { ReportRepository } from '../../repositories/ReportRepository';
import { LoggingService } from '@/core/logging/LoggingService';
import { ReportType } from '@/domain/dtos/ReportDtos';
import { AppError } from '@/types/errors';

// Mock dependencies
jest.mock('../../repositories/ReportRepository');
jest.mock('@/core/logging/LoggingService');

describe('ReportService', () => {
  let reportService: ReportService;
  let mockReportRepository: jest.Mocked<ReportRepository>;
  let mockLogger: jest.Mocked<LoggingService>;
  
  beforeEach(() => {
    mockReportRepository = new ReportRepository() as jest.Mocked<ReportRepository>;
    mockLogger = new LoggingService('test') as jest.Mocked<LoggingService>;
    reportService = new ReportService(mockReportRepository, mockLogger);
    
    // Mock the getCurrentUserId method
    jest.spyOn(reportService as any, 'getCurrentUserId').mockReturnValue('test-user-id');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getReports', () => {
    it('should return all reports', async () => {
      // Arrange
      const mockReports = [
        { id: '1', name: 'Test Report 1', type: ReportType.SALES },
        { id: '2', name: 'Test Report 2', type: ReportType.CUSTOM }
      ];
      mockReportRepository.findMany.mockResolvedValue(mockReports);
      
      // Act
      const result = await reportService.getReports();
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(mockReportRepository.findMany).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching all reports');
    });
    
    it('should handle repository errors', async () => {
      // Arrange
      const mockError = new Error('Database error');
      mockReportRepository.findMany.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(reportService.getReports()).rejects.toThrow('Failed to fetch reports');
      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching reports', mockError);
    });
  });
  
  // Add more tests for other methods...
});

// Add tests for other components, hooks, and API routes
```

### Step 15: Export from Feature Index

```typescript
// features/reports/index.ts
// Export only what is needed by other features

// Components that can be used by other features
export * from './components';

// Hooks for use in other features
export * from './hooks';

// Permission constants for system integration
export { ReportPermissions } from './lib/utils/reportPermissions';
```

## Best Practices for Feature Implementation

1. **Start with domain models**: Always begin by defining your domain models, interfaces, and DTOs. This ensures a clear contract for your feature.

2. **Consistent implementation**: Follow the established patterns in the codebase. Look at similar features for guidance.

3. **Clear separation of concerns**:
   - Repositories handle data access
   - Services implement business logic
   - Components handle UI rendering
   - Hooks manage state and API interactions

4. **Client/Server separation**: Implement server-side and client-side versions of services where appropriate.

5. **Error handling**: Implement comprehensive error handling at each layer:
   - Use appropriate error types (e.g., AppError)
   - Include contextual information in error messages
   - Log errors with appropriate severity
   - Present user-friendly error messages in the UI

6. **Logging**: Add logging at appropriate points:
   - Log method entry points at INFO level
   - Log errors at ERROR level
   - Include context information in log messages

7. **Permission integration**: Properly integrate with the permission system:
   - Define clear permission constants
   - Register permissions with the system
   - Check permissions before operations
   - Provide appropriate UI for unauthorized users

8. **Testing**: Write tests for each layer of your feature:
   - Unit tests for services and repositories
   - Integration tests for API routes
   - Component tests for React components

9. **Documentation**: Document your feature's API and any complex business logic.

10. **Progressive enhancement**: Implement the core functionality first, then add advanced features.

## Common Pitfalls

1. **Tight coupling**: Avoid directly importing services from other features. Use dependency injection and interfaces instead.

2. **Duplicated code**: Check for existing utilities or shared components before implementing new ones.

3. **Missing interfaces**: Always define interfaces for your services and repositories in the domain layer.

4. **Improper error handling**: Handle errors at each layer and provide meaningful error messages.

5. **Inconsistent naming**: Follow the naming conventions established in the codebase.

6. **Ignoring dependency injection**: Use the service factory pattern for creating service instances.

7. **Skipping tests**: Ensure adequate test coverage for your feature.

8. **Missing permission checks**: Always check permissions before performing sensitive operations.

9. **Inadequate logging**: Add appropriate logging to help with debugging and monitoring.

10. **Poor error messages**: Provide clear, actionable error messages for users and developers.

## Conclusion

Following this step-by-step guide will help you implement features that align with the feature-based architecture of the Rising-BSM application. This approach ensures:

- Clear separation of concerns
- Maintainable code structure
- Scalable feature development
- Consistent implementation patterns
- Proper error handling and logging
- Comprehensive testing
- Appropriate permission integration

By following these guidelines, you can contribute high-quality, well-structured features to the application that seamlessly integrate with the existing architecture.