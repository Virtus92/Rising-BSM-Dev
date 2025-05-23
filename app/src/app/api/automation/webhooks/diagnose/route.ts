/**
 * Webhook Diagnostic API Route
 * 
 * POST /api/automation/webhooks/diagnose - Run comprehensive webhook diagnostics
 */

import { NextRequest } from 'next/server';
import { diagnoseWebhookRoute } from '@/features/automation/api/routes/diagnose-webhook-route';

export async function POST(request: NextRequest) {
  return diagnoseWebhookRoute(request);
}
