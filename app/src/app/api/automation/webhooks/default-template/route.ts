/**
 * Default Template API Route
 * 
 * GET /api/automation/webhooks/default-template - Get default template
 */

import { NextRequest } from 'next/server';
import { getDefaultTemplateRoute } from '@/features/automation/api/routes';

export async function GET(request: NextRequest) {
  return getDefaultTemplateRoute(request);
}
