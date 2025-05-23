/**
 * Automation Webhooks API Routes
 * 
 * GET /api/automation/webhooks - List webhooks
 * POST /api/automation/webhooks - Create webhook
 */

import { NextRequest } from 'next/server';
import { createWebhookRoute, getWebhooksRoute } from '@/features/automation/api/routes';

export async function GET(request: NextRequest) {
  return getWebhooksRoute(request);
}

export async function POST(request: NextRequest) {
  return createWebhookRoute(request);
}
