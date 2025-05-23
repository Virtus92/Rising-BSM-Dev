/**
 * Automation Executions API Routes
 * 
 * GET /api/automation/executions - List executions
 */

import { NextRequest } from 'next/server';
import { getExecutionsRoute } from '@/features/automation/api/routes';

export async function GET(request: NextRequest) {
  return getExecutionsRoute(request);
}
