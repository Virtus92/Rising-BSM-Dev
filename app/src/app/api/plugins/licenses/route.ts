import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { withAuth } from '@/features/auth/middleware';
import { getPluginLicenseService } from '@/core/factories/index.server';
import { z } from 'zod';
import { getLogger } from '@/core/logging';

export const runtime = 'nodejs';

// GET /api/plugins/licenses - Get user's licenses
export const GET = withAuth(
  async (request: NextRequest) => {
    const logger = getLogger();
    try {
      const userId = (request as any).auth?.userId;
      if (!userId) {
        return NextResponse.json(
          formatResponse.error('User ID not found in auth context', 401),
          { status: 401 }
        );
      }
      
      const active = request.nextUrl.searchParams.get('active') === 'true';
      const licenseService = getPluginLicenseService();
      
      const licenses = active 
        ? await licenseService.getActiveLicenses(userId)
        : await licenseService.getUserLicenses(userId);

      return NextResponse.json(
        formatResponse.success(licenses, 'Licenses retrieved successfully'),
        { status: 200 }
      );
    } catch (error: any) {
      logger.error('Error retrieving licenses:', error);
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to retrieve licenses', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.license.view']
  }
);

// POST /api/plugins/licenses - Generate a new license
const generateLicenseSchema = z.object({
  pluginId: z.number().positive(),
  type: z.enum(['trial', 'basic', 'premium', 'enterprise']),
  hardwareId: z.string().optional(),
  maxInstalls: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  usageLimits: z.record(z.any()).optional()
});

export const POST = withAuth(
  async (request: NextRequest) => {
    const logger = getLogger();
    try {
      const body = await request.json();
      const validatedData = generateLicenseSchema.parse(body);
      
      const userId = (request as any).auth?.userId;
      if (!userId) {
        return NextResponse.json(
          formatResponse.error('User ID not found in auth context', 401),
          { status: 401 }
        );
      }
      
      const licenseService = getPluginLicenseService();
      
      const license = await licenseService.generateLicense(
        validatedData.pluginId,
        userId,
        validatedData.type,
        {
          hardwareId: validatedData.hardwareId,
          maxInstalls: validatedData.maxInstalls,
          expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
          usageLimits: validatedData.usageLimits
        }
      );

      return NextResponse.json(
        formatResponse.success(license, 'License generated successfully'),
        { status: 201 }
      );
    } catch (error: any) {
      logger.error('Error generating license:', error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          formatResponse.error('Invalid license data', 400),
          { status: 400 }
        );
      }
      return NextResponse.json(
        formatResponse.error(error instanceof Error ? error.message : 'Failed to generate license', 500),
        { status: 500 }
      );
    }
  },
  {
    requiredPermission: ['plugin.license.create']
  }
);