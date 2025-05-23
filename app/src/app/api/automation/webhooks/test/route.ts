/**
 * Test Webhook API Route
 * 
 * POST /api/automation/webhooks/test - Test webhook connection
 */

import { NextRequest } from 'next/server';
import { testWebhookRoute } from '@/features/automation/api/routes';

export async function POST(request: NextRequest) {
  return testWebhookRoute(request);
}
