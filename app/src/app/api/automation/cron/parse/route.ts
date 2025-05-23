/**
 * Parse Cron Expression API Route
 * 
 * POST /api/automation/cron/parse - Parse and validate cron expression
 */

import { NextRequest } from 'next/server';
import { parseCronExpressionRoute } from '@/features/automation/api/routes';

export async function POST(request: NextRequest) {
  return parseCronExpressionRoute(request);
}
