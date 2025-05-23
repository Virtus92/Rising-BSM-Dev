/**
 * Webhook By ID API Routes
 * 
 * GET /api/automation/webhooks/[id] - Get webhook by ID
 * PUT /api/automation/webhooks/[id] - Update webhook
 * DELETE /api/automation/webhooks/[id] - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getWebhookByIdRoute, 
  updateWebhookRoute, 
  deleteWebhookRoute 
} from '@/features/automation/api/routes';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return getWebhookByIdRoute(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return updateWebhookRoute(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return deleteWebhookRoute(request, context);
}
