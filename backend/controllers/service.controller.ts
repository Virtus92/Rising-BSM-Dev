// controllers/service.controller.ts
import { Request, Response } from 'express';
import { ValidationSchema, ValidationRule } from '../utils/validators';
import prisma from '../utils/prisma.utils';
import { formatDateSafely, formatCurrency } from '../utils/formatters';
import { 
  NotFoundError, 
  ValidationError,
  BadRequestError
} from '../utils/errors';
import { validateInput } from '../utils/validators';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/authenticated-request';
import config from '../config';
import { convertValidationSchema } from '../utils/validation-types';

// Type definitions
interface ServiceData {
  name: string;
  beschreibung?: string | null;
  preis_basis: number;
  einheit: string;
  mwst_satz?: number;
  aktiv?: boolean | string;
}

interface ServiceFilterOptions {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface MonthRevenue {
  monat: string;
  umsatz: number;
}

interface ServiceRecord {
  id: number;
  name: string;
  description: string | null;
  priceBase: number | bigint;
  unit: string | null;
  vatRate: number | bigint;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all services with optional filtering
 */
export const getAllServices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const { 
    status, 
    search, 
    page = 1, 
    limit = config.DEFAULT_PAGE_SIZE 
  } = req.query as unknown as ServiceFilterOptions;

  // Validate and sanitize pagination parameters
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(config.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config.DEFAULT_PAGE_SIZE));
  const skip = (pageNumber - 1) * pageSize;

  // Build filter conditions
  const where: any = {};
  
  if (status === 'aktiv') {
    where.active = true;
  } else if (status === 'inaktiv') {
    where.active = false;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Execute queries in parallel
  const [services, totalCount] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: { name: 'asc' },
      take: pageSize,
      skip
    }),
    prisma.service.count({ where })
  ]);

  // Format service data
  const formattedServices = services.map((service: ServiceRecord): Record<string, any> => ({
    id: service.id,
    name: service.name,
    beschreibung: service.description,
    preis_basis: parseFloat(service.priceBase?.toString() || '0'),
    einheit: service.unit || '',
    mwst_satz: parseFloat(service.vatRate?.toString() || '0'),
    aktiv: service.active,
    created_at: formatDateSafely(service.createdAt, 'dd.MM.yyyy'),
    updated_at: formatDateSafely(service.updatedAt, 'dd.MM.yyyy')
  }));

  // Calculate pagination data
  const totalPages = Math.ceil(totalCount / pageSize);

  // Return data object for rendering or JSON response
  res.status(200).json({
    success: true,
    services: formattedServices,
    pagination: {
      current: pageNumber,
      limit: pageSize,
      total: totalPages,
      totalRecords: totalCount
    },
    filters: {
      status,
      search
    }
  });
});

/**
 * Get service by ID
 */
export const getServiceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const serviceId = Number(id);
  
  if (isNaN(serviceId)) {
    throw new BadRequestError('Invalid service ID');
  }

  // Get service details
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  });
  
  if (!service) {
    throw new NotFoundError(`Service with ID ${serviceId} not found`);
  }
  
  // Format service data for response
  res.status(200).json({
    success: true,
    service: {
      id: service.id,
      name: service.name,
      beschreibung: service.description || '',
      preis_basis: parseFloat(service.priceBase?.toString() || '0'),
      einheit: service.unit || '',
      mwst_satz: parseFloat(service.vatRate?.toString() || '0'),
      aktiv: service.active,
      created_at: formatDateSafely(service.createdAt, 'dd.MM.yyyy'),
      updated_at: formatDateSafely(service.updatedAt, 'dd.MM.yyyy')
    }
  });
});

/**
 * Create a new service
 */
export const createService = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Validation schema
  const validationSchema: ValidationSchema = {
    name: { type: 'text', required: true, minLength: 2 },
    beschreibung: { type: 'text', required: false },
    preis_basis: { type: 'numeric', required: true, min: 0 },
    einheit: { type: 'text', required: true },
    mwst_satz: { type: 'numeric', required: false },
    aktiv: { type: 'text', required: false }
  };

  // Convert to base schema
  const baseSchema = convertValidationSchema(validationSchema);

  const { validatedData } = validateInput<ServiceData>(
    req.body, 
    baseSchema,
    { throwOnError: true }
  );

  // Insert service into database
  const newService = await prisma.service.create({
    data: {
      name: validatedData.name,
      description: validatedData.beschreibung || null,
      priceBase: validatedData.preis_basis,
      unit: validatedData.einheit,
      vatRate: validatedData.mwst_satz || 20,
      active: validatedData.aktiv === 'on' || validatedData.aktiv === true
    }
  });
  
  // Log the activity
  if (req.user?.id) {
    await prisma.serviceLog.create({
      data: {
        serviceId: newService.id,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'created',
        details: 'Service created'
      }
    });
  }

  res.status(201).json({
    success: true,
    serviceId: newService.id,
    message: 'Service created successfully'
  });
});

/**
 * Update an existing service
 */
export const updateService = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const serviceId: number = Number(id);
  
  if (isNaN(serviceId)) {
    throw new BadRequestError('Invalid service ID');
  }

  // Validation schema
  const validationSchema: ValidationSchema = {
    name: { type: 'text', required: true, minLength: 2 },
    beschreibung: { type: 'text', required: false },
    preis_basis: { type: 'numeric', required: true, min: 0 },
    einheit: { type: 'text', required: true },
    mwst_satz: { type: 'numeric', required: false },
    aktiv: { type: 'text', required: false }
  };

  // Convert to base schema
  const baseSchema = convertValidationSchema(validationSchema);

  const { validatedData } = validateInput<ServiceData>(
    req.body, 
    baseSchema,
    { throwOnError: true }
  );

  // Check if service exists
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  });

  if (!service) {
    throw new NotFoundError(`Service with ID ${serviceId} not found`);
  }
  
  // Update service in database
  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: {
      name: validatedData.name,
      description: validatedData.beschreibung || null,
      priceBase: validatedData.preis_basis,
      unit: validatedData.einheit,
      vatRate: validatedData.mwst_satz || 20,
      active: validatedData.aktiv === 'on' || validatedData.aktiv === true,
      updatedAt: new Date()
    }
  });
  
  // Log the activity
  if (req.user?.id) {
    await prisma.serviceLog.create({
      data: {
        serviceId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'updated',
        details: 'Service updated'
      }
    });
  }

  res.status(200).json({
    success: true,
    serviceId,
    message: 'Service updated successfully'
  });
});

/**
 * Toggle service status (active/inactive)
 */
export const toggleServiceStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const serviceId = Number(id);
  const { aktiv } = req.body;
  
  if (isNaN(serviceId)) {
    throw new BadRequestError('Invalid service ID');
  }
  
  // Check if service exists
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  });

  if (!service) {
    throw new NotFoundError(`Service with ID ${serviceId} not found`);
  }
  
  const newStatus = aktiv === 'on' || aktiv === true;
  
  // Update service status in database
  await prisma.service.update({
    where: { id: serviceId },
    data: {
      active: newStatus,
      updatedAt: new Date()
    }
  });
  
  // Log the activity
  if (req.user?.id) {
    await prisma.serviceLog.create({
      data: {
        serviceId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'status_changed',
        details: `Status changed to: ${newStatus ? 'active' : 'inactive'}`
      }
    });
  }

  res.status(200).json({
    success: true,
    serviceId,
    message: `Service ${newStatus ? 'activated' : 'deactivated'} successfully`
  });
});

/**
 * Get service statistics
 */
export const getServiceStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const serviceId = Number(id);
  
  if (isNaN(serviceId)) {
    throw new BadRequestError('Invalid service ID');
  }
  
  // Validate service exists
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  });
  
  if (!service) {
    throw new NotFoundError(`Service with ID ${serviceId} not found`);
  }
  
  interface InvoicePosition {
    invoiceId: number;
    serviceId: number;
    quantity: number;
    unitPrice: number;
    Invoice?: {
      id: number;
      invoiceDate: Date;
      Customer?: {
        id: number;
        name: string;
      }
    }
  }
  
  interface ResultItem {
    invoiceId: number;
    _sum: {
      quantity: number | null;
      unitPrice: number | null;
    }
  }
  
  interface CustomerTotal {
    id: number;
    name: string;
    total_amount: number;
  }
  
  // Execute statistics queries in parallel
  const [
    invoicePositions,
    topCustomers
  ] = await Promise.all([
    // Total revenue for this service
    prisma.invoicePosition.findMany({
      where: { serviceId },
      include: {
        Invoice: true
      }
    }),
    
    // Top customers for this service (using Prisma instead of raw SQL)
    prisma.invoicePosition.groupBy({
      by: ['invoiceId'],
      where: { serviceId },
      _sum: {
        quantity: true,
        unitPrice: true
      },
      orderBy: {
        _sum: {
          unitPrice: 'desc'
        }
      },
      take: 5
    }).then(async (results: ResultItem[]) => {
      // Get invoice IDs
      const invoiceIds = results.map((item: ResultItem) => item.invoiceId);
      
      // Get customer information from invoices
      const invoices = await prisma.invoice.findMany({
        where: {
          id: { in: invoiceIds }
        },
        include: {
          Customer: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      interface MonthRevenue {
        monat: string;
        umsatz: number;
      }
    })
  ]);
  
  // Calculate total revenue
  const totalRevenue = invoicePositions.reduce(
    (sum: number, pos: InvoicePosition) => sum + (Number(pos.quantity) * Number(pos.unitPrice)),
    0
  );
  
  // Group by month for monthly revenue
  const invoicesByMonth = invoicePositions.reduce((acc: Record<string, { monat: string, umsatz: number }>, pos: InvoicePosition) => {
    if (!pos.Invoice || !pos.Invoice.invoiceDate) return acc;
    
    const date = new Date(pos.Invoice.invoiceDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        monat: monthKey,
        umsatz: 0
      };
    }
    
    acc[monthKey].umsatz += Number(pos.quantity) * Number(pos.unitPrice);
    return acc;
  }, {});
  
  interface MonthRevenue {
    monat: string;
    umsatz: number;
  }
  
  const monthlyRevenue = (Object.values(invoicesByMonth) as MonthRevenue[]).sort((a, b) => 
    a.monat.localeCompare(b.monat)
  );
  
  res.status(200).json({
    success: true,
    statistics: {
      name: service.name,
      gesamtumsatz: totalRevenue,
      rechnungsanzahl: new Set(invoicePositions.map((p: InvoicePosition) => p.invoiceId)).size,
      monatlicheUmsaetze: monthlyRevenue,
      topKunden: Array.isArray(topCustomers) ? topCustomers.map((customer: any) => ({
        kundenId: customer.id,
        kundenName: customer.name,
        umsatz: parseFloat(customer.total_amount?.toString() || '0')
      })) : []
    }
  });
});