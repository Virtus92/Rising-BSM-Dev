/**
 * Automation Dashboard API Route
 * 
 * GET /api/automation/dashboard - Get dashboard data
 */

import { NextRequest } from 'next/server';
import { getDashboardRoute } from '@/features/automation/api/routes';

export async function GET(request: NextRequest) {
  return getDashboardRoute(request);
}
