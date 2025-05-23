/**
 * Template Preview API Route
 * 
 * POST /api/automation/webhooks/preview - Preview webhook template
 */

import { NextRequest } from 'next/server';
import { previewTemplateRoute } from '@/features/automation/api/routes';

export async function POST(request: NextRequest) {
  return previewTemplateRoute(request);
}
