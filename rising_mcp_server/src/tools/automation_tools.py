from typing import Dict, Any, List, Optional
from datetime import datetime
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field
from src.bms_client import bms_client
from src.logger import get_logger

logger = get_logger(__name__)


class TriggerWebhookInput(BaseModel):
    webhook_id: str = Field(..., description="Webhook ID to trigger")
    payload: Dict[str, Any] = Field(..., description="Custom payload data to send")
    test_mode: bool = Field(False, description="Whether to run in test mode (no actual external call)")


class CreateWebhookInput(BaseModel):
    name: str = Field(..., description="Webhook name")
    url: str = Field(..., description="Webhook URL to call")
    entity_type: str = Field(..., description="Entity type to monitor (customer, request, appointment)")
    event_type: str = Field(..., description="Event type to trigger on (created, updated, deleted)")
    active: bool = Field(True, description="Whether the webhook is active")
    headers: Optional[Dict[str, str]] = Field(None, description="Custom headers to send")
    filters: Optional[Dict[str, Any]] = Field(None, description="Filters to apply to events")


class CreateScheduledTaskInput(BaseModel):
    name: str = Field(..., description="Task name")
    schedule: str = Field(..., description="Cron expression for schedule (e.g., '0 9 * * *' for daily at 9am)")
    task_type: str = Field(..., description="Type of task (report, cleanup, sync)")
    payload: Dict[str, Any] = Field(..., description="Task configuration payload")
    timezone: str = Field("UTC", description="Timezone for the schedule")
    active: bool = Field(True, description="Whether the task is active")


class ExecuteWorkflowInput(BaseModel):
    workflow_name: str = Field(..., description="Name of the workflow to execute")
    context: Dict[str, Any] = Field(..., description="Context data for the workflow")
    async_execution: bool = Field(True, description="Whether to execute asynchronously")


class AutomationTools:
    """Tools for automation and workflow management in BMS"""
    
    @staticmethod
    def list_tools() -> List[Tool]:
        """List available automation tools"""
        return [
            Tool(
                name="automation_trigger_webhook",
                description="Manually trigger a configured webhook",
                inputSchema=TriggerWebhookInput.schema()
            ),
            Tool(
                name="automation_create_webhook",
                description="Create a new automation webhook",
                inputSchema=CreateWebhookInput.schema()
            ),
            Tool(
                name="automation_schedule_task",
                description="Create a new scheduled task",
                inputSchema=CreateScheduledTaskInput.schema()
            ),
            Tool(
                name="workflow_execute",
                description="Execute a custom workflow",
                inputSchema=ExecuteWorkflowInput.schema()
            )
        ]
    
    @staticmethod
    async def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> List[TextContent]:
        """Execute an automation tool"""
        try:
            if tool_name == "automation_trigger_webhook":
                input_data = TriggerWebhookInput(**arguments)
                
                # Add metadata to payload
                payload = {
                    **input_data.payload,
                    "_metadata": {
                        "triggered_by": "mcp_server",
                        "triggered_at": datetime.utcnow().isoformat(),
                        "test_mode": input_data.test_mode
                    }
                }
                
                result = await bms_client.trigger_webhook(
                    input_data.webhook_id,
                    payload
                )
                
                return [TextContent(
                    type="text",
                    text=f"Successfully triggered webhook {input_data.webhook_id}. Execution ID: {result.get('executionId', 'N/A')}"
                )]
                
            elif tool_name == "automation_create_webhook":
                input_data = CreateWebhookInput(**arguments)
                
                webhook_data = {
                    "name": input_data.name,
                    "url": input_data.url,
                    "entityType": input_data.entity_type,
                    "eventType": input_data.event_type,
                    "active": input_data.active,
                    "headers": input_data.headers or {},
                    "filters": input_data.filters or {},
                    "service": "n8n"  # Default to n8n for MCP integration
                }
                
                result = await bms_client.create_webhook(webhook_data)
                
                return [TextContent(
                    type="text",
                    text=f"Successfully created webhook '{input_data.name}' with ID: {result['id']}"
                )]
                
            elif tool_name == "automation_schedule_task":
                input_data = CreateScheduledTaskInput(**arguments)
                
                schedule_data = {
                    "name": input_data.name,
                    "schedule": input_data.schedule,
                    "taskType": input_data.task_type,
                    "payload": input_data.payload,
                    "timezone": input_data.timezone,
                    "active": input_data.active,
                    "nextRun": None  # Will be calculated by the BMS
                }
                
                result = await bms_client.create_scheduled_task(schedule_data)
                
                return [TextContent(
                    type="text",
                    text=f"Successfully created scheduled task '{input_data.name}' with ID: {result['id']}. Schedule: {input_data.schedule}"
                )]
                
            elif tool_name == "workflow_execute":
                input_data = ExecuteWorkflowInput(**arguments)
                
                # Execute workflow based on name
                workflow_results = []
                
                if input_data.workflow_name == "process_pending_requests":
                    # Workflow: Process all pending requests
                    pending = await bms_client.get_requests(limit=50, status="pending")
                    processed = 0
                    
                    for request in pending.get("requests", []):
                        # Auto-assign based on workload or rules
                        users = await bms_client.get_users(active_only=True)
                        if users.get("users"):
                            # Simple assignment to first available user
                            await bms_client.assign_request(
                                request["id"],
                                users["users"][0]["id"]
                            )
                            processed += 1
                    
                    workflow_results.append(f"Processed {processed} pending requests")
                    
                elif input_data.workflow_name == "daily_summary_report":
                    # Workflow: Generate daily summary
                    stats = await bms_client.get_dashboard_stats()
                    
                    summary = {
                        "date": datetime.utcnow().date().isoformat(),
                        "customers": {
                            "total": stats["customers"]["total"],
                            "new_today": stats["customers"].get("new_today", 0)
                        },
                        "requests": {
                            "pending": stats["requests"]["pending"],
                            "completed_today": stats["requests"].get("completed_today", 0)
                        },
                        "appointments": {
                            "today": stats["appointments"].get("today", 0),
                            "upcoming": stats["appointments"]["upcoming"]
                        }
                    }
                    
                    workflow_results.append(f"Generated daily summary: {summary}")
                    
                elif input_data.workflow_name == "customer_follow_up":
                    # Workflow: Identify customers needing follow-up
                    customers = await bms_client.get_customers(limit=100, status="active")
                    follow_ups_needed = []
                    
                    for customer in customers.get("customers", []):
                        # Check if customer has no recent activity
                        # This is a simplified example
                        if customer.get("lastContactDays", 0) > 30:
                            follow_ups_needed.append(customer["id"])
                    
                    workflow_results.append(f"Identified {len(follow_ups_needed)} customers needing follow-up")
                    
                else:
                    workflow_results.append(f"Unknown workflow: {input_data.workflow_name}")
                
                execution_mode = "async" if input_data.async_execution else "sync"
                
                return [TextContent(
                    type="text",
                    text=f"Workflow '{input_data.workflow_name}' executed ({execution_mode}). Results: {'; '.join(workflow_results)}"
                )]
                
            else:
                raise ValueError(f"Unknown automation tool: {tool_name}")
                
        except Exception as e:
            logger.error(f"Error executing automation tool {tool_name}: {e}")
            return [TextContent(
                type="text",
                text=f"Error executing {tool_name}: {str(e)}"
            )]


automation_tools = AutomationTools()