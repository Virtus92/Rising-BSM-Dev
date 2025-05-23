import { PrismaClient } from '@prisma/client';
import { AutomationEntityType, AutomationOperation } from '../src/domain/entities/AutomationWebhook';

const prisma = new PrismaClient();

async function seedAutomation() {
  console.log('🌱 Seeding automation data...');

  try {
    // Create test webhooks
    const webhooks = await Promise.all([
      prisma.automationWebhook.create({
        data: {
          name: 'Customer Created Notification',
          description: 'Sends notification when a new customer is created',
          entityType: AutomationEntityType.CUSTOMER,
          operation: AutomationOperation.CREATE,
          webhookUrl: 'https://webhook.site/customer-created',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key'
          },
          payloadTemplate: {
            event: 'customer.created',
            customer_id: '{{entity.id}}',
            customer_name: '{{entity.name}}',
            timestamp: '{{timestamp}}'
          },
          active: true,
          retryCount: 3,
          retryDelaySeconds: 30
        }
      }),
      prisma.automationWebhook.create({
        data: {
          name: 'Appointment Scheduled Alert',
          description: 'Alerts when a new appointment is scheduled',
          entityType: AutomationEntityType.APPOINTMENT,
          operation: AutomationOperation.CREATE,
          webhookUrl: 'https://webhook.site/appointment-scheduled',
          headers: {
            'Content-Type': 'application/json'
          },
          payloadTemplate: {
            event: 'appointment.scheduled',
            appointment_id: '{{entity.id}}',
            date: '{{entity.appointmentDate}}',
            customer_id: '{{entity.customerId}}'
          },
          active: true,
          retryCount: 2,
          retryDelaySeconds: 60
        }
      }),
      prisma.automationWebhook.create({
        data: {
          name: 'Request Status Update',
          description: 'Webhook for request status changes',
          entityType: AutomationEntityType.REQUEST,
          operation: AutomationOperation.UPDATE,
          webhookUrl: 'https://webhook.site/request-updated',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          payloadTemplate: {
            event: 'request.updated',
            request_id: '{{entity.id}}',
            status: '{{entity.status}}',
            updated_at: '{{timestamp}}'
          },
          active: false, // Inactive webhook for testing
          retryCount: 5,
          retryDelaySeconds: 120
        }
      })
    ]);

    console.log(`✅ Created ${webhooks.length} test webhooks`);

    // Create test schedules
    const schedules = await Promise.all([
      prisma.automationSchedule.create({
        data: {
          name: 'Daily Report Generator',
          description: 'Generates daily activity report',
          cronExpression: '0 9 * * *', // Daily at 9 AM
          webhookUrl: 'https://webhook.site/daily-report',
          headers: {
            'Content-Type': 'application/json'
          },
          payload: {
            report_type: 'daily',
            include_stats: true
          },
          timezone: 'Europe/Vienna',
          active: true,
          nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        }
      }),
      prisma.automationSchedule.create({
        data: {
          name: 'Weekly Backup',
          description: 'Triggers weekly backup process',
          cronExpression: '0 2 * * 0', // Sunday at 2 AM
          webhookUrl: 'https://webhook.site/weekly-backup',
          headers: {
            'Content-Type': 'application/json',
            'X-Backup-Key': 'secure-key'
          },
          payload: {
            backup_type: 'full',
            compress: true
          },
          timezone: 'UTC',
          active: true,
          nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next week
        }
      })
    ]);

    console.log(`✅ Created ${schedules.length} test schedules`);

    // Create test executions
    const executions = await Promise.all([
      // Successful webhook execution
      prisma.automationExecution.create({
        data: {
          automationType: 'webhook',
          automationId: webhooks[0].id,
          entityId: 1,
          entityType: AutomationEntityType.CUSTOMER,
          status: 'success',
          responseStatus: 200,
          responseBody: '{"success": true, "message": "Webhook received"}',
          executionTimeMs: 245,
          executedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          retryAttempt: 0
        }
      }),
      // Failed webhook execution
      prisma.automationExecution.create({
        data: {
          automationType: 'webhook',
          automationId: webhooks[1].id,
          entityId: 2,
          entityType: AutomationEntityType.APPOINTMENT,
          status: 'failed',
          responseStatus: 500,
          errorMessage: 'Internal server error at webhook endpoint',
          executionTimeMs: 1523,
          executedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          retryAttempt: 1
        }
      }),
      // Successful schedule execution
      prisma.automationExecution.create({
        data: {
          automationType: 'schedule',
          automationId: schedules[0].id,
          status: 'success',
          responseStatus: 200,
          responseBody: '{"report_generated": true}',
          executionTimeMs: 3456,
          executedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          retryAttempt: 0
        }
      }),
      // Recent successful execution
      prisma.automationExecution.create({
        data: {
          automationType: 'webhook',
          automationId: webhooks[0].id,
          entityId: 3,
          entityType: AutomationEntityType.CUSTOMER,
          status: 'success',
          responseStatus: 201,
          responseBody: '{"created": true}',
          executionTimeMs: 189,
          executedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          retryAttempt: 0
        }
      })
    ]);

    console.log(`✅ Created ${executions.length} test executions`);

    // Display summary
    const stats = await prisma.$transaction([
      prisma.automationWebhook.count(),
      prisma.automationWebhook.count({ where: { active: true } }),
      prisma.automationSchedule.count(),
      prisma.automationSchedule.count({ where: { active: true } }),
      prisma.automationExecution.count(),
      prisma.automationExecution.count({ where: { status: 'success' } }),
      prisma.automationExecution.count({ where: { status: 'failed' } })
    ]);

    console.log('\n📊 Automation System Summary:');
    console.log(`   Total Webhooks: ${stats[0]} (${stats[1]} active)`);
    console.log(`   Total Schedules: ${stats[2]} (${stats[3]} active)`);
    console.log(`   Total Executions: ${stats[4]}`);
    console.log(`   - Successful: ${stats[5]}`);
    console.log(`   - Failed: ${stats[6]}`);
    console.log(`   Success Rate: ${stats[4] > 0 ? ((stats[5] / stats[4]) * 100).toFixed(1) : 0}%`);

  } catch (error) {
    console.error('❌ Error seeding automation data:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  seedAutomation()
    .then(() => {
      console.log('\n✅ Automation seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Automation seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { seedAutomation };
