/**
 * Template Variables API Route
 * 
 * GET /api/automation/webhooks/variables - Get available template variables
 */

import { NextRequest } from 'next/server';
import { getTemplateVariablesRoute } from '@/features/automation/api/routes';

export async function GET(request: NextRequest) {
  return getTemplateVariablesRoute(request);
}
