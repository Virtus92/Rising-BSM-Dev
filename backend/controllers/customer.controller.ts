import { Request, Response } from 'express';
import { ValidationSchema, convertValidationSchema } from '../utils/validation-types';
import { validateInput } from '../utils/validators';
import prisma from '../utils/prisma.utils';
import { formatDateSafely } from '../utils/formatters';
import { getProjektStatusInfo, getTerminStatusInfo } from '../utils/helpers';
import { 
  NotFoundError, 
  ValidationError,
  BadRequestError
} from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/authenticated-request';
import config from '../config';

// Type definitions
interface CustomerData {
  name: string;
  firma?: string;
  email: string;
  telefon?: string;
  adresse?: string;
  plz?: string;
  ort?: string;
  notizen?: string;
  newsletter?: boolean | string;
  status?: string;
  kundentyp?: string;
}

interface CustomerFilterOptions {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Get all customers with optional filtering
 */
export const getAllCustomers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const { 
    status, 
    type: kundentyp, 
    search, 
    page = 1, 
    limit = config.DEFAULT_PAGE_SIZE 
  } = req.query as unknown as CustomerFilterOptions;
  
  // Validate and sanitize pagination parameters
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(config.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config.DEFAULT_PAGE_SIZE));
  const skip = (pageNumber - 1) * pageSize;

  // Build filter conditions
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (kundentyp) {
    where.type = kundentyp;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Execute database queries in parallel
  const [customers, totalCount, stats, growthData] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      take: pageSize,
      skip
    }),
    prisma.customer.count({ where }),
    
    // Get customer statistics
    prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN type = 'privat' THEN 1 END) AS privat,
        COUNT(CASE WHEN type = 'geschaeft' THEN 1 END) AS geschaeft,
        COUNT(CASE WHEN status = 'aktiv' THEN 1 END) AS aktiv
      FROM "Customer"
    `,
    
    // Get growth data for the chart
    prisma.$queryRaw<any[]>`
      SELECT
        DATE_TRUNC('month', "createdAt") AS month,
        COUNT(*) AS customer_count
      FROM "Customer"
      WHERE status != 'geloescht' AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `
  ]);

  // Format customer data
  // Interface for raw customer data from the database
  interface CustomerRecord {
    id: number;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    status: string;
    type: string;
    createdAt: Date;
  }

  // Interface for formatted customer data for the response
  interface FormattedCustomer {
    id: number;
    name: string;
    firma: string;
    email: string;
    telefon: string;
    adresse: string;
    plz: string;
    ort: string;
    status: string;
    statusLabel: string;
    statusClass: string;
    kundentyp: string;
    kundentypLabel: string;
    created_at: string;
  }

  const formattedCustomers: FormattedCustomer[] = customers.map((customer: CustomerRecord) => ({
    id: customer.id,
    name: customer.name,
    firma: customer.company || '',
    email: customer.email || '',
    telefon: customer.phone || '',
    adresse: customer.address || '',
    plz: customer.postalCode || '',
    ort: customer.city || '',
    status: customer.status,
    statusLabel: customer.status === 'aktiv' ? 'Aktiv' : 'Inaktiv',
    statusClass: customer.status === 'aktiv' ? 'success' : 'secondary',
    kundentyp: customer.type,
    kundentypLabel: customer.type === 'privat' ? 'Privatkunde' : 'Geschäftskunde',
    created_at: formatDateSafely(customer.createdAt, 'dd.MM.yyyy')
  }));

  // Calculate pagination data
  const totalPages = Math.ceil(totalCount / pageSize);

  interface GrowthDataItem {
    month: Date;
    customer_count: number;
  }
  
  const formattedGrowthData = growthData.map((row: GrowthDataItem) => ({
    month: formatDateSafely(row.month, 'MM/yyyy'),
    customer_count: Number(row.customer_count)
  }));
  
  // Use the formatted data in your response
  res.status(200).json({
    // Other properties...
    growthData: formattedGrowthData
  });
});

/**
 * Get customer by ID with related data
 */
export const getCustomerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const customerId = Number(id);
  
  if (isNaN(customerId)) {
    throw new BadRequestError('Invalid customer ID');
  }

  // Get customer details
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });
  
  if (!customer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }

  // Get appointments for this customer with Promise.all for parallel execution
  const [appointments, projects] = await Promise.all([
    prisma.appointment.findMany({
      where: { customerId },
      orderBy: { appointmentDate: 'desc' },
      take: 10
    }),
    
    prisma.project.findMany({
      where: { customerId },
      orderBy: { startDate: 'desc' },
      take: 10
    })
  ]);
  
  // Fix for appointments.map with explicit typing
  interface AppointmentRecord {
    id: number;
    title: string;
    appointmentDate: Date;
    status: string;
  }
  
  const formattedAppointments = appointments.map((appointment: AppointmentRecord) => {
    const statusInfo = getTerminStatusInfo(appointment.status);
    return {
      id: appointment.id,
      titel: appointment.title,
      datum: formatDateSafely(appointment.appointmentDate, 'dd.MM.yyyy, HH:mm'),
      status: appointment.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className
    };
  });
  
  // Fix for projects.map with explicit typing
  interface ProjectRecord {
    id: number;
    title: string;
    startDate: Date;
    status: string;
  }
  
  const formattedProjects = projects.map((project: ProjectRecord) => {
    const statusInfo = getProjektStatusInfo(project.status);
    return {
      id: project.id,
      titel: project.title,
      datum: formatDateSafely(project.startDate, 'dd.MM.yyyy'),
      status: project.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className
    };
  });
  
  // Format customer data for response
  const result = {
    customer: {
      id: customer.id,
      name: customer.name,
      firma: customer.company || 'Nicht angegeben',
      email: customer.email || '',
      telefon: customer.phone || 'Nicht angegeben',
      adresse: customer.address || 'Nicht angegeben',
      plz: customer.postalCode || '',
      ort: customer.city || '',
      kundentyp: customer.type === 'privat' ? 'Privatkunde' : 'Geschäftskunde',
      status: customer.status,
      statusLabel: customer.status === 'aktiv' ? 'Aktiv' : 'Inaktiv',
      statusClass: customer.status === 'aktiv' ? 'success' : 'secondary',
      notizen: customer.notes || 'Keine Notizen vorhanden',
      newsletter: customer.newsletter,
      created_at: formatDateSafely(customer.createdAt, 'dd.MM.yyyy')
    },
    appointments: formattedAppointments,
    projects: formattedProjects
  };
  
  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * Create a new customer
 */
export const createCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Validate input using the validator utility
  const validationSchema: ValidationSchema = {
    name: { type: 'text', required: true, minLength: 2 },
    email: { type: 'email', required: true },
    firma: { type: 'text', required: false },
    telefon: { type: 'phone', required: false },
    adresse: { type: 'text', required: false },
    plz: { type: 'text', required: false },
    ort: { type: 'text', required: false },
    notizen: { type: 'text', required: false },
    newsletter: { type: 'text', required: false },
    status: { type: 'text', required: false },
    kundentyp: { type: 'text', required: false }
  };

  const baseSchema = convertValidationSchema(validationSchema);

  const { validatedData } = validateInput<CustomerData>(
    req.body, 
    baseSchema,
    { throwOnError: true }
  );
  
  // Check if email is already in use
  const existingCustomer = await prisma.customer.findFirst({
    where: { email: validatedData.email }
  });
  
  if (existingCustomer) {
    throw new ValidationError('Email is already in use', ['Email is already in use']);
  }
  
  // Insert customer into database
  const newCustomer = await prisma.customer.create({
    data: {
      name: validatedData.name,
      company: validatedData.firma || null,
      email: validatedData.email,
      phone: validatedData.telefon || null,
      address: validatedData.adresse || null,
      postalCode: validatedData.plz || null,
      city: validatedData.ort || null,
      type: validatedData.kundentyp || 'privat',
      status: validatedData.status || 'aktiv',
      notes: validatedData.notizen || null,
      newsletter: validatedData.newsletter === 'on' || validatedData.newsletter === true
    }
  });
  
  // Log the activity
  if (req.user?.id) {
    await prisma.customerLog.create({
      data: {
        customerId: newCustomer.id,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'created',
        details: 'Customer created'
      }
    });
  }

  res.status(201).json({
    success: true,
    customerId: newCustomer.id,
    message: 'Customer created successfully'
  });
});

/**
 * Update an existing customer
 */
export const updateCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const customerId = Number(id);
  
  if (isNaN(customerId)) {
    throw new BadRequestError('Invalid customer ID');
  }

  // Validate input using the validator utility
  const validationSchema: ValidationSchema = {
    name: { type: 'text', required: true, minLength: 2 },
    email: { type: 'email', required: true },
    firma: { type: 'text', required: false },
    telefon: { type: 'phone', required: false },
    adresse: { type: 'text', required: false },
    plz: { type: 'text', required: false },
    ort: { type: 'text', required: false },
    notizen: { type: 'text', required: false },
    newsletter: { type: 'text', required: false },
    status: { type: 'text', required: false },
    kundentyp: { type: 'text', required: false }
  };

  const baseSchema = convertValidationSchema(validationSchema);

  const { validatedData } = validateInput<CustomerData>(
    req.body, 
    baseSchema,
    { throwOnError: true }
  );
  
  // Check if customer exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { id: customerId }
  });

  if (!existingCustomer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }
  
  // Check if email is unique (if changed)
  if (validatedData.email !== existingCustomer.email) {
    const emailCheck = await prisma.customer.findFirst({
      where: {
        email: validatedData.email,
        id: { not: customerId }
      }
    });
    
    if (emailCheck) {
      throw new ValidationError('Email address is already in use', 
        ['Email address is already in use']);
    }
  }
  
  // Update customer in database
  const updatedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: validatedData.name,
      company: validatedData.firma || null,
      email: validatedData.email,
      phone: validatedData.telefon || null,
      address: validatedData.adresse || null,
      postalCode: validatedData.plz || null,
      city: validatedData.ort || null,
      type: validatedData.kundentyp || 'privat',
      status: validatedData.status || 'aktiv',
      notes: validatedData.notizen || null,
      newsletter: validatedData.newsletter === 'on' || validatedData.newsletter === true,
      updatedAt: new Date()
    }
  });
  
  // Log the update activity
  if (req.user?.id) {
    await prisma.customerLog.create({
      data: {
        customerId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'updated',
        details: 'Customer information updated'
      }
    });
  }

  res.status(200).json({
    success: true,
    customerId,
    message: 'Customer updated successfully'
  });
});

/**
 * Add a note to customer
 */
export const addCustomerNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const customerId = Number(id);
  const { notiz } = req.body;

  if (isNaN(customerId)) {
    throw new BadRequestError('Invalid customer ID');
  }
  
  if (!notiz || notiz.trim() === '') {
    throw new ValidationError('Note cannot be empty', ['Note cannot be empty']);
  }
  
  // Get customer
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });
  
  if (!customer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }
  
  const currentNotes = customer.notes || '';
  const timestamp = formatDateSafely(new Date(), 'dd.MM.yyyy, HH:mm');
  const userName = req.user?.name || 'Unknown';
  
  // Format the new note with timestamp and username
  const newNote = `${timestamp} - ${userName}:\n${notiz}\n\n${currentNotes}`;
  
  // Update notes in database
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      notes: newNote,
      updatedAt: new Date()
    }
  });
  
  // Log the note activity
  if (req.user?.id) {
    await prisma.customerLog.create({
      data: {
        customerId,
        userId: req.user.id,
        userName,
        action: 'note_added',
        details: 'Note added to customer'
      }
    });
  }

  res.status(200).json({
    success: true,
    customerId,
    message: 'Note added successfully'
  });
});

/**
 * Update customer status
 */
export const updateCustomerStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, status } = req.body;
  const customerId = Number(id);
  
  if (isNaN(customerId)) {
    throw new BadRequestError('Invalid customer ID');
  }
  
  // Validation
  if (!status) {
    throw new ValidationError('Status is required', ['Status is required']);
  }
  
  // Check valid status values
  if (!['aktiv', 'inaktiv', 'geloescht'].includes(status)) {
    throw new ValidationError('Invalid status value', 
      ['Status must be one of: aktiv, inaktiv, geloescht']);
  }
  
  // Check if customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });
  
  if (!customer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }
  
  // Update status in database
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      status,
      updatedAt: new Date()
    }
  });
  
  // Log the status change
  if (req.user?.id) {
    await prisma.customerLog.create({
      data: {
        customerId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'status_changed',
        details: `Status changed to: ${status}`
      }
    });
  }

  res.status(200).json({
    success: true,
    customerId,
    message: 'Customer status updated successfully'
  });
});

/**
 * Delete a customer (mark as deleted)
 */
export const deleteCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.body;
  const customerId = Number(id);
  
  if (isNaN(customerId)) {
    throw new BadRequestError('Invalid customer ID');
  }
  
  // Check if customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });
  
  if (!customer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }
  
  // Check if customer has related projects or appointments
  const [relatedProjects, relatedAppointments] = await Promise.all([
    prisma.project.count({
      where: { customerId }
    }),
    
    prisma.appointment.count({
      where: { customerId }
    })
  ]);
  
  if (relatedProjects > 0 || relatedAppointments > 0) {
    throw new BadRequestError(
      `Cannot delete customer. ${relatedProjects} projects and 
      ${relatedAppointments} appointments are still linked to this customer.`
    );
  }
  
  // Mark as deleted instead of actual deletion
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      status: 'geloescht',
      updatedAt: new Date()
    }
  });
  
  // Log the deletion
  if (req.user?.id) {
    await prisma.customerLog.create({
      data: {
        customerId,
        userId: req.user.id,
        userName: req.user.name || 'Unknown',
        action: 'deleted',
        details: 'Customer marked as deleted'
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Customer successfully deleted'
  });
});
