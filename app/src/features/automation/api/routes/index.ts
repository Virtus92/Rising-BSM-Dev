/**
 * Automation API Routes
 * 
 * Central export for all automation API route handlers
 */

// Webhook routes
export { createWebhookRoute } from './create-webhook-route';
export { getWebhooksRoute } from './get-webhooks-route';
export { getWebhookByIdRoute } from './get-webhook-by-id-route';
export { updateWebhookRoute } from './update-webhook-route';
export { deleteWebhookRoute } from './delete-webhook-route';
export { toggleWebhookRoute } from './toggle-webhook-route';
export { testWebhookRoute } from './test-webhook-route';
export { debugWebhookRoute } from './debug-webhook-route';
export { diagnoseWebhookRoute } from './diagnose-webhook-route';

// Schedule routes
export { createScheduleRoute } from './create-schedule-route';
export { getSchedulesRoute } from './get-schedules-route';

// Execution routes
export { getExecutionsRoute } from './get-executions-route';

// Dashboard routes
export { getDashboardRoute } from './get-dashboard-route';

// Utility routes
export { parseCronExpressionRoute } from './parse-cron-route';
