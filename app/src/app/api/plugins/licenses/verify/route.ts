import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getPluginLicenseService } from '@/core/factories/index.server';
import { VerifyLicenseDto } from '@/domain/dtos/PluginDtos';
import { z } from 'zod';
import { getLogger } from '@/core/logging';

export const runtime = 'nodejs';

// POST /api/plugins/licenses/verify - Verify a license
const verifyLicenseSchema = z.object({
  licenseKey: z.string(),
  hardwareId: z.string(),
  pluginId: z.number().positive(),
  timestamp: z.number().optional(),
  signature: z.string().optional()
});

export async function POST(request: NextRequest) {
  const logger = getLogger();
  try {
    const body = await request.json();
    const validatedData = verifyLicenseSchema.parse(body);
    
    const verifyDto: VerifyLicenseDto = {
      licenseKey: validatedData.licenseKey,
      hardwareId: validatedData.hardwareId,
      pluginId: validatedData.pluginId
    };
    
    const licenseService = getPluginLicenseService();
    const result = await licenseService.verifyLicense(verifyDto);

    if (!result.valid) {
      return NextResponse.json(
        formatResponse.error(result.error || 'License verification failed', 400),
        { status: 400 }
      );
    }

    return NextResponse.json(
      formatResponse.success({
        valid: true,
        license: result.license,
        offline: result.offline
      }, 'License verified successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error verifying license:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatResponse.error('Invalid verification data', 400),
        { status: 400 }
      );
    }
    return NextResponse.json(
      formatResponse.error(error instanceof Error ? error.message : 'Failed to verify license', 500),
      { status: 500 }
    );
  }
}