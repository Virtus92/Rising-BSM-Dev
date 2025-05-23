/**
 * Toggle Webhook Active Status API Route
 * 
 * PATCH /api/automation/webhooks/[id]/toggle - Toggle webhook active status
 */

import { NextRequest, NextResponse } from 'next/server';
import { toggleWebhookRoute } from '@/features/automation/api/routes';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return toggleWebhookRoute(request, context);
}
