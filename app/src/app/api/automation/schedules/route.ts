/**
 * Automation Schedules API Routes
 * 
 * GET /api/automation/schedules - List schedules
 * POST /api/automation/schedules - Create schedule
 */

import { NextRequest } from 'next/server';
import { createScheduleRoute, getSchedulesRoute } from '@/features/automation/api/routes';

export async function GET(request: NextRequest) {
  return getSchedulesRoute(request);
}

export async function POST(request: NextRequest) {
  return createScheduleRoute(request);
}
