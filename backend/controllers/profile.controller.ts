import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.utils.js';
import { formatDateSafely } from '../utils/formatters.js';
import { ValidationError, BadRequestError, NotFoundError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/authenticated-request.js';
import { ResponseFactory } from '../utils/response.factory.js';

/**
 * Get current user profile data
 */
export const getUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  
  // Get user data from database with Prisma
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      profilePicture: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Get user settings
  const settings = await prisma.userSettings.findUnique({
    where: { userId }
  });
  
  // Default settings if none exist
  const userSettings = settings || {
    language: 'de',
    darkMode: false,
    emailNotifications: true,
    pushNotifications: false,
    notificationInterval: 'sofort'
  };
  
  // Get user activity with type
  const activity = await prisma.userActivity.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 5
  });
  
  // Format data for response with explicit typing
  const profileData = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      telefon: user.phone || '',
      rolle: user.role,
      profilbild: user.profilePicture || null,
      seit: formatDateSafely(user.createdAt, 'dd.MM.yyyy')
    },
    settings: {
      sprache: userSettings.language || 'de',
      dark_mode: userSettings.darkMode || false,
      benachrichtigungen_email: userSettings.emailNotifications || true,
      benachrichtigungen_push: userSettings.pushNotifications || false,
      benachrichtigungen_intervall: userSettings.notificationInterval || 'sofort'
    },
    activity: activity.map((item: any) => ({
      type: item.activity,
      ip: item.ipAddress || '',
      date: formatDateSafely(item.timestamp!, 'dd.MM.yyyy, HH:mm')
    }))
  };
  
  // Use ResponseFactory instead of direct response
  ResponseFactory.success(res, profileData);
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  const { name, email, telefon } = req.body;
  
  // Validation
  if (!name || !email) {
    throw new ValidationError('Name and email are required fields');
  }
  
  // Check if email is unique (if changed)
  if (email !== req.user.email) {
    const emailCheck = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });
    
    if (emailCheck) {
      throw new ValidationError('Email address is already in use');
    }
  }
  
  // Update user in database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      phone: telefon || null,
      updatedAt: new Date()
    }
  });
  
  // Log the activity
  await prisma.userActivity.create({
    data: {
      userId,
      activity: 'profile_updated',
      ipAddress: req.ip || '0.0.0.0'
    }
  });
  
  // Use ResponseFactory instead of direct response
  ResponseFactory.success(
    res, 
    {
      user: {
        id: userId,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        initials: updatedUser.name.split(' ').map((n: string) => n[0]).join('')
      }
    },
    'Profile updated successfully'
  );
});

/**
 * Update user password
 */
export const updatePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  const { current_password, new_password, confirm_password } = req.body;
  
  // Validation
  if (!current_password || !new_password || !confirm_password) {
    throw new ValidationError('All password fields are required');
  }
  
  if (new_password !== confirm_password) {
    throw new ValidationError('New passwords do not match');
  }
  
  if (new_password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  // Get current password hash
  const userQuery = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }
  });
  
  if (!userQuery) {
    throw new NotFoundError('User not found');
  }
  
  // Verify current password
  const passwordMatches = await bcrypt.compare(
    current_password, 
    userQuery.password
  );
  
  if (!passwordMatches) {
    throw new ValidationError('Current password is incorrect');
  }
  
  // Hash new password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(new_password, saltRounds);
  
  // Update password in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });
  
  // Log the activity
  await prisma.userActivity.create({
    data: {
      userId,
      activity: 'password_changed',
      ipAddress: req.ip || '0.0.0.0'
    }
  });
  
  // Use ResponseFactory instead of direct response
  ResponseFactory.success(res, {}, 'Password updated successfully');
});

/**
 * Update profile picture
 */
export const updateProfilePicture = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  
  // Check if file was uploaded
  if (!req.file) {
    throw new ValidationError('No image file uploaded');
  }
  
  // Image path (to be stored in database)
  const imagePath = `/uploads/profile/${req.file.filename}`;
  
  // Update profile picture in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      profilePicture: imagePath,
      updatedAt: new Date()
    }
  });
  
  // Use ResponseFactory instead of direct response
  ResponseFactory.success(
    res, 
    { imagePath: imagePath },
    'Profile picture updated successfully'
  );
});

/**
 * Update notification settings
 */
export const updateNotificationSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  const { 
    benachrichtigungen_email, 
    benachrichtigungen_push, 
    benachrichtigungen_intervall 
  } = req.body;
  
  // Check if settings exist for this user
  const existingSettings = await prisma.userSettings.findUnique({
    where: { userId }
  });
  
  if (!existingSettings) {
    // Create new settings
    await prisma.userSettings.create({
      data: {
        userId,
        emailNotifications: benachrichtigungen_email === 'on' || benachrichtigungen_email === true,
        pushNotifications: benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
        notificationInterval: benachrichtigungen_intervall || 'sofort'
      }
    });
  } else {
    // Update existing settings
    await prisma.userSettings.update({
      where: { userId },
      data: {
        emailNotifications: benachrichtigungen_email === 'on' || benachrichtigungen_email === true,
        pushNotifications: benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
        notificationInterval: benachrichtigungen_intervall || 'sofort',
        updatedAt: new Date()
      }
    });
  }
  
  // Use ResponseFactory instead of direct response
  ResponseFactory.success(res, {}, 'Notification settings updated successfully');
});

// Now let's update the appointment.controller.ts file:

/**
 * Get all appointments with optional filtering
 */
export const getAllAppointments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const { 
    status, 
    date, 
    search, 
    page = 1, 
    limit = config.DEFAULT_PAGE_SIZE 
  } = req.query as unknown as AppointmentFilterOptions;

  // Validate and sanitize pagination parameters
  const pageNumber: number = Math.max(1, Number(page) || 1);
  const pageSize: number = Math.min(config.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config.DEFAULT_PAGE_SIZE));
  const skip: number = (pageNumber - 1) * pageSize;

  // Build filter conditions
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (date) {
    where.appointmentDate = {
      gte: new Date(`${date}T00:00:00`),
      lt: new Date(`${date}T23:59:59`)
    };
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { Customer: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Execute queries in parallel
  const [appointments, totalCount] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        Customer: true,
        Project: true
      },
      orderBy: { appointmentDate: 'asc' },
      take: pageSize,
      skip
    }),
    prisma.appointment.count({ where })
  ]);

  // Format appointment data
  const formattedAppointments = appointments.map((appointment: any): Record<string, any> => {
    const statusInfo = getTerminStatusInfo(appointment.status);
    return {
      id: appointment.id,
      titel: appointment.title,
      kunde_id: appointment.customerId,
      kunde_name: appointment.Customer?.name || 'Kein Kunde zugewiesen',
      projekt_id: appointment.projectId,
      projekt_titel: appointment.Project?.title || 'Kein Projekt zugewiesen',
      termin_datum: appointment.appointmentDate,
      dateFormatted: formatDateSafely(appointment.appointmentDate, 'dd.MM.yyyy'),
      timeFormatted: formatDateSafely(appointment.appointmentDate, 'HH:mm'),
      dauer: appointment.duration !== null ? appointment.duration : 60,
      ort: appointment.location || 'Nicht angegeben',
      status: appointment.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className
    };
  });

  // Calculate pagination data
  const totalPages: number = Math.ceil(totalCount / pageSize);

  // Use ResponseFactory instead of direct response
  ResponseFactory.paginated(
    res,
    formattedAppointments,
    {
      current: pageNumber,
      limit: pageSize,
      total: totalPages,
      totalRecords: totalCount
    },
    'Appointments retrieved successfully',
    200,
    { filters: { status, date, search } }
  );
});