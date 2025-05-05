/**
 * File Upload API
 * This endpoint handles file uploads and stores them properly
 */
import { NextRequest } from 'next/server';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/server/route-handler';
import { prisma } from '@/core/db/index';

// Configure upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';

// Constants for path configuration
const PUBLIC_PREFIX = '/uploads'; // This will be used for URLs returned to the client

// Ensure path consistency for profile pictures
const getUploadPath = (type: string) => {
  // Normalize the type name for consistency
  const normalizedType = type.toLowerCase();
  
  // Handle special case for profile pictures
  if (normalizedType === 'profilepictures' || normalizedType === 'profilepicture') {
    return 'profilePictures'; // Ensure consistent casing
  }
  
  return type || 'general';
};

// Allowed MIME types
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

// Maximum file size (5MB)
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/files/upload
 * Uploads a file to the server and returns a reference
 */
export const POST = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    const userId = formData.get('userId') as string | null;

    // Validate file presence
    if (!file) {
      return formatResponse.error('No file provided', 400);
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return formatResponse.error(`File too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB`, 400);
    }

    // Validate file type
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
      return formatResponse.error(
        `Invalid file type. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}`,
        400
      );
    }

    // Get file extension based on mime type
    const extension = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];

    // Create upload directory if it doesn't exist
    const uploadType = getUploadPath(type || 'general');
    const uploadPath = join(UPLOAD_DIR, uploadType);
    
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // Generate unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`;
    const filepath = join(uploadPath, filename);
    
    // Construct the URL path for client - strip 'public/' prefix if present
    // This ensures we return a path that starts with /uploads/ not /public/uploads/
    const relativePath = `${PUBLIC_PREFIX}/${uploadType}/${filename}`;

    // Convert the file to an ArrayBuffer and then to a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Save the file to disk
    await writeFile(filepath, buffer);
    
    // Store file metadata in the database
    const fileRecord = await prisma.file.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        path: relativePath,
        size: file.size,
        uploadedBy: userId ? parseInt(userId, 10) : undefined,
        uploadedAt: new Date(),
        type: uploadType
      }
    });

    logger.info(`File uploaded successfully: ${filepath}`);
    
    // Return successful response with file information
    return formatResponse.success({
      fileId: fileRecord.id,
      filePath: relativePath,
      fileName: filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: fileRecord.uploadedAt.toISOString()
    }, 'File uploaded successfully');

  } catch (error) {
    logger.error('Error uploading file:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to upload file',
      500
    );
  }
}, {
  requiresAuth: true
});